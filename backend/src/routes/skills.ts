// src/routes/skills.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/skills — list all skills (with optional search)
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category } = req.query as Record<string, string>;
    const skills = await prisma.skill.findMany({
      where: {
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { name: 'asc' },
      take: 100,
    });
    res.json(skills);
  } catch (err) { next(err); }
});

// GET /api/v1/skills/categories
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await prisma.skill.findMany({ select: { category: true }, distinct: ['category'] });
    res.json(skills.map((s) => s.category));
  } catch (err) { next(err); }
});

export default router;
