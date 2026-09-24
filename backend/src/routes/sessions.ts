// src/routes/sessions.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireVerified } from '../middleware/auth';
import { createSessionSchema } from '../utils/validators';

const router = Router();

// POST /api/v1/sessions
router.post('/', requireAuth, requireVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const userId = req.user!.userId;

    const swap = await prisma.swapRequest.findUnique({ where: { id: data.swapRequestId } });
    if (!swap) { res.status(404).json({ error: 'Swap request not found' }); return; }
    if (swap.status !== 'accepted') {
      res.status(400).json({ error: 'Swap must be accepted before scheduling a session' }); return;
    }
    if (swap.requesterId !== userId && swap.recipientId !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    const session = await prisma.session.create({
      data: {
        swapRequestId: data.swapRequestId,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes,
        meetingLink: data.meetingLink || '',
      },
      include: { swapRequest: { include: { requester: true, recipient: true } } },
    });

    // Update swap status to scheduled
    await prisma.swapRequest.update({ where: { id: data.swapRequestId }, data: { status: 'scheduled' } });

    // Notify both participants
    const otherUserId = userId === swap.requesterId ? swap.recipientId : swap.requesterId;
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'session_scheduled',
        payload: JSON.stringify({ sessionId: session.id, scheduledAt: data.scheduledAt }),
      },
    });

    res.status(201).json(session);
  } catch (err) { next(err); }
});

// GET /api/v1/sessions
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const sessions = await prisma.session.findMany({
      where: {
        swapRequest: {
          OR: [{ requesterId: userId }, { recipientId: userId }],
        },
      },
      include: {
        swapRequest: {
          include: {
            requester: { select: { id: true, name: true, avatarUrl: true } },
            recipient: { select: { id: true, name: true, avatarUrl: true } },
            skill: true,
          },
        },
        reviews: { where: { reviewerId: userId } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    res.json(sessions);
  } catch (err) { next(err); }
});

// GET /api/v1/sessions/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        swapRequest: {
          include: {
            requester: { select: { id: true, name: true, avatarUrl: true } },
            recipient: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        reviews: true,
      },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

    const userId = req.user!.userId;
    const { requesterId, recipientId } = session.swapRequest;
    if (requesterId !== userId && recipientId !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }
    res.json(session);
  } catch (err) { next(err); }
});

// PATCH /api/v1/sessions/:id — mark completed, triggers credit transfer
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const userId = req.user!.userId;

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { swapRequest: true },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

    const { requesterId, recipientId } = session.swapRequest;
    if (requesterId !== userId && recipientId !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    if (status === 'completed' && session.status !== 'completed') {
      // Use a transaction to update session + issue credits atomically
      const [updatedSession] = await prisma.$transaction([
        prisma.session.update({
          where: { id: session.id },
          data: { status: 'completed' },
        }),
        prisma.swapRequest.update({
          where: { id: session.swapRequestId },
          data: { status: 'completed' },
        }),
        // Credit both participants (10 credits each)
        prisma.creditTransaction.create({
          data: {
            userId: requesterId,
            amount: 10,
            relatedSessionId: session.id,
            reason: 'Session completed',
          },
        }),
        prisma.creditTransaction.create({
          data: {
            userId: recipientId,
            amount: 10,
            relatedSessionId: session.id,
            reason: 'Session completed',
          },
        }),
        // Notify both to leave a review
        prisma.notification.create({
          data: {
            userId: requesterId,
            type: 'review_prompt',
            payload: JSON.stringify({ sessionId: session.id }),
          },
        }),
        prisma.notification.create({
          data: {
            userId: recipientId,
            type: 'review_prompt',
            payload: JSON.stringify({ sessionId: session.id }),
          },
        }),
      ]);

      res.json(updatedSession);
      return;
    }

    if (status === 'cancelled') {
      const updated = await prisma.session.update({
        where: { id: session.id },
        data: { status: 'cancelled' },
      });
      res.json(updated);
      return;
    }

    res.status(400).json({ error: 'Invalid status transition' });
  } catch (err) { next(err); }
});

export default router;

