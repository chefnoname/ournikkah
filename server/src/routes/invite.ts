import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db';
import { workspaceInvites, workspaceMembers, workspaces } from '../db/schema';
import { requireUser } from '../middleware/auth';

const router = Router();

// GET /api/invite/:code
router.get('/:code', async (req, res) => {
  const code = String(req.params.code);

  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.code, code))
    .limit(1);

  if (!invite) {
    res.status(404).json({ message: 'Invalid invite code' });
    return;
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    res.status(410).json({ message: 'Invite has expired' });
    return;
  }

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, invite.workspaceId))
    .limit(1);

  res.json({
    inviteCode: code,
    workspace: workspace ?? null,
  });
});

// POST /api/invite/:code/accept
router.post('/:code/accept', requireUser, async (req, res) => {
  const code = String(req.params.code);

  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.code, code))
    .limit(1);

  if (!invite) {
    res.status(404).json({ message: 'Invalid invite code' });
    return;
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    res.status(410).json({ message: 'Invite has expired' });
    return;
  }

  // Check if already a member
  const [existing] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, invite.workspaceId),
        eq(workspaceMembers.userId, req.user!.id)
      )
    )
    .limit(1);

  if (existing) {
    res.json({ message: 'Already a member', workspaceId: invite.workspaceId });
    return;
  }

  await db.insert(workspaceMembers).values({
    workspaceId: invite.workspaceId,
    userId: req.user!.id,
    role: 'member',
  });

  res.status(201).json({ message: 'Joined workspace', workspaceId: invite.workspaceId });
});

export default router;
