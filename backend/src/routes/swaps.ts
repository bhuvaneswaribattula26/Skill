// src/routes/swaps.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireVerified } from '../middleware/auth';
import { swapRateLimit } from '../middleware/rateLimit';
import { createSwapSchema, updateSwapSchema } from '../utils/validators';

const router = Router();

// POST /api/v1/swaps
router.post('/', requireAuth, requireVerified, swapRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSwapSchema.parse(req.body);

    if (data.recipientId === req.user!.userId) {
      res.status(400).json({ error: 'Cannot swap with yourself' });
      return;
    }

    // Check for existing pending/accepted swap between these users
    const existing = await prisma.swapRequest.findFirst({
      where: {
        OR: [
          { requesterId: req.user!.userId, recipientId: data.recipientId },
          { requesterId: data.recipientId, recipientId: req.user!.userId },
        ],
        status: { in: ['requested', 'accepted', 'scheduled'] },
      },
    });
    if (existing) {
      res.status(409).json({ error: 'An active swap already exists between you and this user' });
      return;
    }

    const swap = await prisma.swapRequest.create({
      data: {
        requesterId: req.user!.userId,
        recipientId: data.recipientId,
        skillId: data.skillId,
        message: data.message || '',
      },
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true } },
        skill: true,
      },
    });

    // Notify recipient
    await prisma.notification.create({
      data: {
        userId: data.recipientId,
        type: 'swap_request',
        payload: JSON.stringify({
          swapId: swap.id,
          requesterName: swap.requester.name,
          message: data.message,
        }),
      },
    });

    res.status(201).json(swap);
  } catch (err) { next(err); }
});

// GET /api/v1/swaps
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, role } = req.query as Record<string, string>;
    const userId = req.user!.userId;

    const where: any = {
      OR: [{ requesterId: userId }, { recipientId: userId }],
    };
    if (status) where.status = status;
    if (role === 'requester') { delete where.OR; where.requesterId = userId; }
    if (role === 'recipient') { delete where.OR; where.recipientId = userId; }

    const swaps = await prisma.swapRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true } },
        skill: true,
        sessions: { orderBy: { scheduledAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(swaps);
  } catch (err) { next(err); }
});

// GET /api/v1/swaps/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const swap = await prisma.swapRequest.findUnique({
      where: { id: req.params.id },
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true, collegeName: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true, collegeName: true } },
        skill: true,
        sessions: true,
      },
    });
    if (!swap) { res.status(404).json({ error: 'Swap not found' }); return; }

    const userId = req.user!.userId;
    if (swap.requesterId !== userId && swap.recipientId !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }
    res.json(swap);
  } catch (err) { next(err); }
});

// PATCH /api/v1/swaps/:id
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateSwapSchema.parse(req.body);
    const userId = req.user!.userId;

    const swap = await prisma.swapRequest.findUnique({ where: { id: req.params.id } });
    if (!swap) { res.status(404).json({ error: 'Swap not found' }); return; }

    // Only recipient can accept/decline; both can cancel
    if ((data.status === 'accepted' || data.status === 'declined') && swap.recipientId !== userId) {
      res.status(403).json({ error: 'Only the recipient can accept or decline' }); return;
    }
    if (data.status === 'cancelled' && swap.requesterId !== userId && swap.recipientId !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    const updated = await prisma.swapRequest.update({
      where: { id: req.params.id },
      data: { status: data.status as any },
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify the other party
    const notifyUserId = userId === swap.requesterId ? swap.recipientId : swap.requesterId;
    const notifyName = userId === swap.requesterId ? updated.requester.name : updated.recipient.name;
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: `swap_${data.status}`,
        payload: JSON.stringify({ swapId: swap.id, fromName: notifyName, status: data.status }),
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
});

export default router;

