import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { notes } from '../db/schema';
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  workspaceId: z.number().int().positive(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

// GET /api/workspaces/:workspaceId/notes — mounted on workspaces router
export const listNotes = [requireAuth, requireWorkspaceAccess, async (req: any, res: any) => {
  const workspaceId = parseInt(req.params.id, 10);
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.workspaceId, workspaceId))
    .orderBy(desc(notes.updatedAt));
  res.json(rows);
}];

// POST /api/notes
router.post('/', requireAuth, async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  // Verify workspace access
  const wsId = parse.data.workspaceId;
  const hasAccess =
    req.guestWorkspaceId === wsId ||
    (req.user && await checkUserWorkspaceAccess(req.user.id, wsId));

  if (!hasAccess) {
    res.status(403).json({ message: 'Access denied to this workspace' });
    return;
  }

  const [note] = await db
    .insert(notes)
    .values({
      workspaceId: wsId,
      title: parse.data.title,
      content: parse.data.content,
      updatedByEmail: req.user?.email ?? null,
    })
    .returning();

  res.status(201).json(note);
});

// PUT /api/notes/:id
router.put('/:id', requireAuth, async (req, res) => {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const noteId = parseInt(String(req.params.id), 10);

  // Get the note to check workspace access
  const [note] = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  if (!note) {
    res.status(404).json({ message: 'Note not found' });
    return;
  }

  const hasAccess =
    req.guestWorkspaceId === note.workspaceId ||
    (req.user && await checkUserWorkspaceAccess(req.user.id, note.workspaceId));

  if (!hasAccess) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (parse.data.title !== undefined) updates.title = parse.data.title;
  if (parse.data.content !== undefined) updates.content = parse.data.content;
  if (req.user?.email) updates.updatedByEmail = req.user.email;

  const [updated] = await db
    .update(notes)
    .set(updates)
    .where(eq(notes.id, noteId))
    .returning();

  res.json(updated);
});

// DELETE /api/notes/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const noteId = parseInt(String(req.params.id), 10);

  const [note] = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  if (!note) {
    res.status(404).json({ message: 'Note not found' });
    return;
  }

  const hasAccess =
    req.guestWorkspaceId === note.workspaceId ||
    (req.user && await checkUserWorkspaceAccess(req.user.id, note.workspaceId));

  if (!hasAccess) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  await db.delete(notes).where(eq(notes.id, noteId));
  res.json({ message: 'Deleted' });
});

// Helper: check if user is a member of a workspace
async function checkUserWorkspaceAccess(userId: number, workspaceId: number): Promise<boolean> {
  const { workspaceMembers } = await import('../db/schema');
  const [member] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);
  return !!member;
}

export default router;
