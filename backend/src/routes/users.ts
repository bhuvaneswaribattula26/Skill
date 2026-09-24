// src/routes/users.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireVerified } from '../middleware/auth';
import { updateProfileSchema, addSkillSchema } from '../utils/validators';

const router = Router();

const userSelect = {
  id: true, name: true, email: true, avatarUrl: true, collegeName: true,
  bio: true, isVerified: true, lastActiveAt: true, createdAt: true,
  skillsTeach: { include: { skill: true } },
  skillsLearn: { include: { skill: true } },
  reviewsReceived: { select: { rating: true } },
  _count: { select: { swapsAsRequester: true, swapsAsRecipient: true } },
};

function formatUser(u: any) {
  const ratings = u.reviewsReceived?.map((r: any) => r.rating) || [];
  const avgRating = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : null;
  return {
    id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl,
    collegeName: u.collegeName, bio: u.bio, isVerified: u.isVerified,
    lastActiveAt: u.lastActiveAt, createdAt: u.createdAt,
    skillsTeach: u.skillsTeach?.map((s: any) => ({ id: s.skill.id, name: s.skill.name, category: s.skill.category, proficiency: s.proficiency })),
    skillsLearn: u.skillsLearn?.map((s: any) => ({ id: s.skill.id, name: s.skill.name, category: s.skill.category, proficiency: s.proficiency })),
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    totalSwaps: (u._count?.swapsAsRequester || 0) + (u._count?.swapsAsRecipient || 0),
  };
}

// GET /api/v1/users/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: userSelect });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(formatUser(user));
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/me
router.patch('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: userSelect,
    });
    res.json(formatUser(updated));
  } catch (err) { next(err); }
});

// GET /api/v1/users — list all verified users (with search)
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await prisma.user.findMany({
      where: {
        isVerified: true,
        isSuspended: false,
        id: { not: req.user!.userId },
        ...(q ? {
          OR: [
            { name: { contains: q,  } },
            { collegeName: { contains: q,  } },
            { skillsTeach: { some: { skill: { name: { contains: q,  } } } } },
            { skillsLearn: { some: { skill: { name: { contains: q,  } } } } },
          ],
        } : {}),
        ...(category ? {
          OR: [
            { skillsTeach: { some: { skill: { category } } } },
            { skillsLearn: { some: { skill: { category } } } },
          ],
        } : {}),
      },
      select: userSelect,
      skip,
      take: parseInt(limit),
      orderBy: { lastActiveAt: 'desc' },
    });

    res.json(users.map(formatUser));
  } catch (err) { next(err); }
});

// GET /api/v1/users/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(formatUser(user));
  } catch (err) { next(err); }
});

// POST /api/v1/users/me/skills-teach
router.post('/me/skills-teach', requireAuth, requireVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = addSkillSchema.parse(req.body);
    let skill;
    if (data.skillId) {
      skill = await prisma.skill.findUnique({ where: { id: data.skillId } });
    } else {
      skill = await prisma.skill.upsert({
        where: { name: data.skillName! },
        update: {},
        create: { name: data.skillName!, category: data.category || 'General' },
      });
    }
    if (!skill) { res.status(404).json({ error: 'Skill not found' }); return; }

    const entry = await prisma.userSkillTeach.upsert({
      where: { userId_skillId: { userId: req.user!.userId, skillId: skill.id } },
      update: { proficiency: data.proficiency },
      create: { userId: req.user!.userId, skillId: skill.id, proficiency: data.proficiency },
      include: { skill: true },
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/me/skills-teach/:skillId
router.delete('/me/skills-teach/:skillId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.userSkillTeach.deleteMany({
      where: { userId: req.user!.userId, skillId: req.params.skillId },
    });
    res.json({ message: 'Skill removed' });
  } catch (err) { next(err); }
});

// POST /api/v1/users/me/skills-learn
router.post('/me/skills-learn', requireAuth, requireVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = addSkillSchema.parse(req.body);
    let skill;
    if (data.skillId) {
      skill = await prisma.skill.findUnique({ where: { id: data.skillId } });
    } else {
      skill = await prisma.skill.upsert({
        where: { name: data.skillName! },
        update: {},
        create: { name: data.skillName!, category: data.category || 'General' },
      });
    }
    if (!skill) { res.status(404).json({ error: 'Skill not found' }); return; }

    const entry = await prisma.userSkillLearn.upsert({
      where: { userId_skillId: { userId: req.user!.userId, skillId: skill.id } },
      update: { proficiency: data.proficiency },
      create: { userId: req.user!.userId, skillId: skill.id, proficiency: data.proficiency },
      include: { skill: true },
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/me/skills-learn/:skillId
router.delete('/me/skills-learn/:skillId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.userSkillLearn.deleteMany({
      where: { userId: req.user!.userId, skillId: req.params.skillId },
    });
    res.json({ message: 'Skill removed' });
  } catch (err) { next(err); }
});

// GET /api/v1/users/:id/reviews
router.get('/:id/reviews', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: req.params.id },
      include: { reviewer: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

export default router;

