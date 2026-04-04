import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { budgetItems } from '../db/schema';
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth';

const router = Router();

// GET /api/workspaces/:id/budget
router.get('/:id/budget', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const workspaceId = parseInt(String(req.params.id), 10);
  const items = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.workspaceId, workspaceId));
  res.json(items);
});

const createSchema = z.object({
  category: z.string().min(1),
  amount: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
});

// POST /api/workspaces/:id/budget
router.post('/:id/budget', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const workspaceId = parseInt(String(req.params.id), 10);
  const [item] = await db
    .insert(budgetItems)
    .values({
      workspaceId,
      category: parse.data.category,
      amount: String(parse.data.amount),
      notes: parse.data.notes ?? null,
    })
    .returning();

  res.status(201).json(item);
});

const updateSchema = z.object({
  category: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

// PUT /api/workspaces/:id/budget/:itemId
router.put('/:id/budget/:itemId', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const itemId = parseInt(String(req.params.itemId), 10);
  const workspaceId = parseInt(String(req.params.id), 10);

  const updates: Record<string, any> = {};
  if (parse.data.category !== undefined) updates.category = parse.data.category;
  if (parse.data.amount !== undefined) updates.amount = String(parse.data.amount);
  if (parse.data.notes !== undefined) updates.notes = parse.data.notes;

  const [updated] = await db
    .update(budgetItems)
    .set(updates)
    .where(and(eq(budgetItems.id, itemId), eq(budgetItems.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    res.status(404).json({ message: 'Budget item not found' });
    return;
  }

  res.json(updated);
});

// DELETE /api/workspaces/:id/budget/:itemId
router.delete('/:id/budget/:itemId', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const itemId = parseInt(String(req.params.itemId), 10);
  const workspaceId = parseInt(String(req.params.id), 10);

  await db
    .delete(budgetItems)
    .where(and(eq(budgetItems.id, itemId), eq(budgetItems.workspaceId, workspaceId)));

  res.json({ message: 'Deleted' });
});

export default router;
