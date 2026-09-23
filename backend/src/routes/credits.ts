// src/routes/credits.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/credits/balance — balance = SUM of all transactions (never stored directly)
router.get('/balance', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.creditTransaction.aggregate({
      where: { userId: req.user!.userId },
      _sum: { amount: true },
    });
    res.json({ balance: result._sum.amount ?? 0 });
  } catch (err) { next(err); }
});

// GET /api/v1/credits/history
router.get('/history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await prisma.$transaction([
      prisma.creditTransaction.findMany({
        where: { userId: req.user!.userId },
        include: { session: { include: { swapRequest: { include: { requester: { select: { name: true } }, recipient: { select: { name: true } } } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.creditTransaction.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({ transactions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

export default router;
