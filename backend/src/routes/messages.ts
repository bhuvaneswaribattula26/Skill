// src/routes/messages.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { sendMessageSchema } from '../utils/validators';

const router = Router();

// GET /api/v1/swaps/:id/messages — paginated history
router.get('/swaps/:id/messages', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const swap = await prisma.swapRequest.findUnique({ where: { id: req.params.id } });
    if (!swap) { res.status(404).json({ error: 'Swap not found' }); return; }
    if (swap.requesterId !== userId && swap.recipientId !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await prisma.$transaction([
      prisma.message.findMany({
        where: { swapRequestId: req.params.id },
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.message.count({ where: { swapRequestId: req.params.id } }),
    ]);

    res.json({ messages, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// POST /api/v1/swaps/:id/messages — REST fallback (Socket.IO is primary)
router.post('/swaps/:id/messages', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    const userId = req.user!.userId;

    const swap = await prisma.swapRequest.findUnique({ where: { id: req.params.id } });
    if (!swap) { res.status(404).json({ error: 'Swap not found' }); return; }
    if (swap.requesterId !== userId && swap.recipientId !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }
    if (!['accepted', 'scheduled', 'completed'].includes(swap.status)) {
      res.status(400).json({ error: 'Swap must be accepted before messaging' }); return;
    }

    const message = await prisma.message.create({
      data: { swapRequestId: req.params.id, senderId: userId, content: data.content },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });
    res.status(201).json(message);
  } catch (err) { next(err); }
});

// GET /api/v1/notifications
router.get('/notifications', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(notifications);
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/notifications/:id/read', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { read: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
});

export default router;
