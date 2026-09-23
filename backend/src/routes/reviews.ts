// src/routes/reviews.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireVerified } from '../middleware/auth';
import { createReviewSchema } from '../utils/validators';

const router = Router();

// POST /api/v1/reviews
router.post('/', requireAuth, requireVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createReviewSchema.parse(req.body);
    const reviewerId = req.user!.userId;

    // Enforce: session must be completed
    const session = await prisma.session.findUnique({
      where: { id: data.sessionId },
      include: { swapRequest: true },
    });

    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    if (session.status !== 'completed') {
      res.status(403).json({ error: 'Can only review completed sessions' }); return;
    }

    // Enforce: reviewer must be a participant (checked at DB query level)
    const { requesterId, recipientId } = session.swapRequest;
    if (reviewerId !== requesterId && reviewerId !== recipientId) {
      res.status(403).json({ error: 'You were not a participant in this session' }); return;
    }

    // Enforce: reviewee must be the other participant
    if (data.revieweeId !== requesterId && data.revieweeId !== recipientId) {
      res.status(400).json({ error: 'Invalid reviewee for this session' }); return;
    }
    if (data.revieweeId === reviewerId) {
      res.status(400).json({ error: 'Cannot review yourself' }); return;
    }

    // Enforce: one review per reviewer per session (unique constraint in DB)
    const review = await prisma.review.create({
      data: {
        sessionId: data.sessionId,
        reviewerId,
        revieweeId: data.revieweeId,
        rating: data.rating,
        comment: data.comment || '',
      },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        reviewee: { select: { id: true, name: true } },
      },
    });

    // Notify reviewee
    await prisma.notification.create({
      data: {
        userId: data.revieweeId,
        type: 'review_received',
        payload: { reviewId: review.id, rating: data.rating, reviewerName: review.reviewer.name },
      },
    });

    res.status(201).json(review);
  } catch (err: any) {
    // Handle unique constraint violation (already reviewed)
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'You have already reviewed this session' }); return;
    }
    next(err);
  }
});

export default router;
