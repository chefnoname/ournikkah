import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { guestTokens, workspaces } from '../db/schema';
import { requireAuth } from '../middleware/auth';

const router = Router();

const onboardingSchema = z.object({
  userName: z.string().nullable().optional(),
  partnerName: z.string().nullable().optional(),
  ceremonyType: z.string().nullable().optional(),
  baseLocation: z.string().optional().default(''),
  name: z.string().optional().default(''),
  hasNikah: z.boolean().optional().default(false),
  hasWalima: z.boolean().optional().default(false),
  nikahDate: z.string().nullable().optional(),
  nikahSeason: z.string().nullable().optional(),
  nikahYear: z.string().nullable().optional(),
  guestCount: z.string().nullable().optional(),
});

// POST /api/guest/start
router.post('/start', async (_req, res) => {
  // Create an empty workspace
  const [workspace] = await db
    .insert(workspaces)
    .values({ name: '' })
    .returning({ id: workspaces.id });

  // Generate a guest token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(guestTokens).values({
    token,
    workspaceId: workspace.id,
    expiresAt,
  });

  res.status(201).json({ guestToken: token, workspaceId: workspace.id });
});

// PUT /api/guest/onboarding
router.put('/onboarding', requireAuth, async (req, res) => {
  if (!req.guestWorkspaceId) {
    res.status(403).json({ message: 'Guest token required for onboarding' });
    return;
  }

  const parse = onboardingSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const data = parse.data;

  // Build nikahDate from exact date or season+year
  let nikahDate = data.nikahDate || null;
  if (!nikahDate && data.nikahSeason && data.nikahYear) {
    nikahDate = `${data.nikahSeason} ${data.nikahYear}`;
  }

  await db
    .update(workspaces)
    .set({
      name: data.name || '',
      userName: data.userName ?? null,
      partnerName: data.partnerName ?? null,
      baseLocation: data.baseLocation || null,
      hasNikah: data.hasNikah ?? false,
      hasWalima: data.hasWalima ?? false,
      nikahDate,
      guestCount: data.guestCount ?? null,
      onboardingCompleted: true,
    })
    .where(eq(workspaces.id, req.guestWorkspaceId));

  res.json({ message: 'Onboarding saved' });
});

// GET /api/guest/workspace
router.get('/workspace', requireAuth, async (req, res) => {
  if (!req.guestWorkspaceId) {
    res.status(403).json({ message: 'Guest token required' });
    return;
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, req.guestWorkspaceId))
    .limit(1);

  if (!workspace) {
    res.status(404).json({ message: 'Workspace not found' });
    return;
  }

  res.json(workspace);
});

export default router;
