import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { savedVendors, vendorItems } from '../db/schema';
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth';

const router = Router();

// GET /api/workspaces/:id/saved-vendors
router.get('/:id/saved-vendors', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const workspaceId = parseInt(String(req.params.id), 10);

  const rows = await db
    .select()
    .from(savedVendors)
    .leftJoin(vendorItems, eq(savedVendors.vendorItemId, vendorItems.id))
    .where(eq(savedVendors.workspaceId, workspaceId));

  res.json(
    rows.map((r) => ({
      ...r.saved_vendors,
      vendorItem: r.vendor_items ?? undefined,
    }))
  );
});

const saveSchema = z.object({
  vendorItemId: z.number().int().positive(),
});

// POST /api/workspaces/:id/saved-vendors
router.post('/:id/saved-vendors', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const parse = saveSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const workspaceId = parseInt(String(req.params.id), 10);

  const [saved] = await db
    .insert(savedVendors)
    .values({ workspaceId, vendorItemId: parse.data.vendorItemId })
    .returning();

  res.status(201).json(saved);
});

// DELETE /api/workspaces/:id/saved-vendors/:vendorId
router.delete('/:id/saved-vendors/:vendorId', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const vendorId = parseInt(String(req.params.vendorId), 10);
  if (isNaN(vendorId)) {
    res.status(400).json({ message: 'Invalid vendor ID' });
    return;
  }

  const workspaceId = parseInt(String(req.params.id), 10);

  await db
    .delete(savedVendors)
    .where(
      and(
        eq(savedVendors.workspaceId, workspaceId),
        eq(savedVendors.id, vendorId)
      )
    );

  res.json({ message: 'Removed' });
});

const statusSchema = z.object({
  contactStatus: z.string().min(1),
});

// PATCH /api/workspaces/:id/saved-vendors/:vendorItemId/status
router.patch('/:id/saved-vendors/:vendorItemId/status', requireAuth, requireWorkspaceAccess, async (req, res) => {
  const parse = statusSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: parse.error.issues[0].message });
    return;
  }

  const workspaceId = parseInt(String(req.params.id), 10);
  const vendorItemId = parseInt(String(req.params.vendorItemId), 10);

  const isBooked = parse.data.contactStatus === 'booked';

  await db
    .update(savedVendors)
    .set({
      contactStatus: parse.data.contactStatus,
      isFinalized: isBooked,
    })
    .where(
      and(
        eq(savedVendors.workspaceId, workspaceId),
        eq(savedVendors.vendorItemId, vendorItemId)
      )
    );

  res.json({ message: 'Status updated' });
});

export default router;
