import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db';
import { vendorItems } from '../db/schema';
import { seedDirectory } from '../seed';

const router = Router();

// GET /api/directory
router.get('/', async (_req, res) => {
  const items = await db.select().from(vendorItems);
  res.json(items);
});

// GET /api/directory/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: 'Invalid ID' });
    return;
  }

  const [item] = await db
    .select()
    .from(vendorItems)
    .where(eq(vendorItems.id, id))
    .limit(1);

  if (!item) {
    res.status(404).json({ message: 'Vendor not found' });
    return;
  }

  res.json(item);
});

// POST /api/admin/seed-directory — mounted separately in index.ts
export async function handleSeedDirectory(_req: any, res: any) {
  await seedDirectory();
  res.json({ message: 'Directory seeded' });
}

export default router;
