import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { guestInvites } from '../db/schema';
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth';

const router = Router();

// GET /api/workspaces/:id/guest-invites
router.get('/:id/guest-invites', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const workspaceId = parseInt(String(req.params.id), 10);
  const items = await db
    .select()
    .from(guestInvites)
    .where(eq(guestInvites.workspaceId, workspaceId));
  res.json(items);
});

const createSchema = z.object({
  guestName: z.string().min(1),
  rsvpStatus: z.string().default('pending'),
});

// POST /api/workspaces/:id/guest-invites
router.post('/:id/guest-invites', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const workspaceId = parseInt(String(req.params.id), 10);
  const [item] = await db
    .insert(guestInvites)
    .values({
      workspaceId,
      guestName: parse.data.guestName,
      rsvpStatus: parse.data.rsvpStatus,
    })
    .returning();

  res.status(201).json(item);
});

const updateSchema = z.object({
  rsvpStatus: z.string().min(1),
});

// PUT /api/workspaces/:id/guest-invites/:inviteId
router.put('/:id/guest-invites/:inviteId', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const inviteId = parseInt(String(req.params.inviteId), 10);
  const workspaceId = parseInt(String(req.params.id), 10);

  const [updated] = await db
    .update(guestInvites)
    .set({ rsvpStatus: parse.data.rsvpStatus })
    .where(and(eq(guestInvites.id, inviteId), eq(guestInvites.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    res.status(404).json({ message: 'Guest invite not found' });
    return;
  }

  res.json(updated);
});

// DELETE /api/workspaces/:id/guest-invites/:inviteId
router.delete('/:id/guest-invites/:inviteId', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const inviteId = parseInt(String(req.params.inviteId), 10);
  const workspaceId = parseInt(String(req.params.id), 10);

  await db
    .delete(guestInvites)
    .where(and(eq(guestInvites.id, inviteId), eq(guestInvites.workspaceId, workspaceId)));

  res.json({ message: 'Deleted' });
});

export default router;
