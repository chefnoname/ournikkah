import crypto from 'crypto';
import { and, eq, sql, sum } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import {
    budgetItems,
    guestInvites,
    savedVendors,
    users,
    vendorItems,
    workspaceInvites,
    workspaceMembers,
    workspaces,
} from '../db/schema';
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth';

const router = Router();

// GET /api/workspaces
router.get('/', requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'User required' });
    return;
  }

  const memberRows = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, req.user.id));

  const wsIds = memberRows.map((r) => r.workspaceId);
  if (wsIds.length === 0) {
    res.json([]);
    return;
  }

  const result = await db
    .select()
    .from(workspaces)
    .where(sql`${workspaces.id} = ANY(${wsIds})`);

  res.json(result);
});

// POST /api/workspaces
router.post('/', requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'User required' });
    return;
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({ name: req.body.name || '', ownerId: req.user.id })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: req.user.id,
    role: 'owner',
  });

  res.status(201).json(workspace);
});

// GET /api/workspaces/:id
router.get('/:id', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, parseInt(String(req.params.id), 10)))
    .limit(1);

  if (!workspace) {
    res.status(404).json({ message: 'Workspace not found' });
    return;
  }

  res.json(workspace);
});

// PUT /api/workspaces/:id
router.put('/:id', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const workspaceId = parseInt(String(req.params.id), 10);
  const [updated] = await db
    .update(workspaces)
    .set(req.body)
    .where(eq(workspaces.id, workspaceId))
    .returning();

  res.json(updated);
});

const settingsSchema = z.object({
  totalBudget: z.number().min(0),
});

// PATCH /api/workspaces/:id/settings
router.patch('/:id/settings', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const parse = settingsSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const workspaceId = parseInt(String(req.params.id), 10);
  await db
    .update(workspaces)
    .set({ totalBudget: String(parse.data.totalBudget) })
    .where(eq(workspaces.id, workspaceId));

  res.json({ message: 'Settings updated' });
});

// POST /api/workspaces/:id/invite
router.post('/:id/invite', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const workspaceId = parseInt(String(req.params.id), 10);

  // Return existing invite if one exists
  const [existing] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.workspaceId, workspaceId))
    .limit(1);

  if (existing) {
    res.json({
      inviteCode: existing.code,
      inviteUrl: `${process.env.CORS_ORIGIN || 'http://localhost:8081'}/invite/${existing.code}`,
    });
    return;
  }

  const code = crypto.randomBytes(16).toString('hex');
  await db.insert(workspaceInvites).values({ workspaceId, code });

  res.status(201).json({
    inviteCode: code,
    inviteUrl: `${process.env.CORS_ORIGIN || 'http://localhost:8081'}/invite/${code}`,
  });
});

// GET /api/workspaces/:id/members
router.get('/:id/members', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const workspaceId = parseInt(String(req.params.id), 10);

  const members = await db
    .select({
      id: workspaceMembers.id,
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
      userEmail: users.email,
    })
    .from(workspaceMembers)
    .leftJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  res.json(
    members.map((m) => ({
      id: m.id,
      workspaceId: m.workspaceId,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.userEmail ? { email: m.userEmail } : undefined,
    }))
  );
});

// GET /api/workspaces/:id/summary
router.get('/:id/summary', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const workspaceId = parseInt(String(req.params.id), 10);

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    res.status(404).json({ message: 'Workspace not found' });
    return;
  }

  // Finalized venues and vendors
  const saved = await db
    .select()
    .from(savedVendors)
    .leftJoin(vendorItems, eq(savedVendors.vendorItemId, vendorItems.id))
    .where(
      and(
        eq(savedVendors.workspaceId, workspaceId),
        eq(savedVendors.contactStatus, 'booked')
      )
    );

  const finalizedVenues = saved
    .filter((s) => s.vendor_items?.section === 'venue')
    .map((s) => s.vendor_items!);
  const finalizedVendors = saved
    .filter((s) => s.vendor_items?.section === 'vendor')
    .map((s) => s.vendor_items!);

  // Saved count
  const allSaved = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(savedVendors)
    .where(eq(savedVendors.workspaceId, workspaceId));
  const savedCount = allSaved[0]?.count ?? 0;

  // Budget
  const budgetResult = await db
    .select({ total: sum(budgetItems.amount) })
    .from(budgetItems)
    .where(eq(budgetItems.workspaceId, workspaceId));
  const budgetSpent = parseFloat(budgetResult[0]?.total ?? '0');

  const budgetItemCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(budgetItems)
    .where(eq(budgetItems.workspaceId, workspaceId));

  // Guest invites
  const guestStats = await db
    .select({
      total: sql<number>`count(*)::int`,
      attending: sql<number>`count(*) filter (where ${guestInvites.rsvpStatus} = 'attending')::int`,
      pending: sql<number>`count(*) filter (where ${guestInvites.rsvpStatus} = 'pending')::int`,
    })
    .from(guestInvites)
    .where(eq(guestInvites.workspaceId, workspaceId));

  // Nikah countdown
  let nikahCountdownDays: number | null = null;
  let nikahDisplay: string | undefined;
  if (workspace.nikahDate) {
    nikahDisplay = workspace.nikahDate;
    const d = new Date(workspace.nikahDate);
    if (!isNaN(d.getTime())) {
      const diff = d.getTime() - Date.now();
      nikahCountdownDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }

  res.json({
    nikahDisplay,
    nikahCountdownDays,
    finalizedVenues,
    finalizedVendors,
    totalBudget: workspace.totalBudget ? parseFloat(workspace.totalBudget) : null,
    budgetSpent,
    budgetItems: budgetItemCount[0]?.count ?? 0,
    savedCount,
    guestCount: workspace.guestCount,
    guestInvites: guestStats[0]?.total ?? 0,
    guestAttending: guestStats[0]?.attending ?? 0,
    guestPending: guestStats[0]?.pending ?? 0,
  });
});

export default router;
