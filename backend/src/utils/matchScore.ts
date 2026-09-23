// src/utils/matchScore.ts — scoring algorithm for skill matching
import { prisma } from '../lib/prisma';

export interface MatchResult {
  userId: string;
  name: string;
  avatarUrl: string;
  collegeName: string;
  bio: string;
  score: number;
  teachSkills: string[];
  learnSkills: string[];
  avgRating: number;
  totalSwaps: number;
  matchReason: string;
  aiExplanation?: string;
}

export async function computeMatches(currentUserId: string): Promise<MatchResult[]> {
  // Load the current user's skills
  const me = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: {
      skillsTeach: { include: { skill: true } },
      skillsLearn: { include: { skill: true } },
    },
  });
  if (!me) return [];

  const myTeachIds = new Set(me.skillsTeach.map((s) => s.skillId));
  const myLearnIds = new Set(me.skillsLearn.map((s) => s.skillId));

  // Load all other active, verified, non-suspended users
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      isVerified: true,
      isSuspended: false,
    },
    include: {
      skillsTeach: { include: { skill: true } },
      skillsLearn: { include: { skill: true } },
      reviewsReceived: { select: { rating: true } },
      swapsAsRequester: { where: { status: 'completed' } },
      swapsAsRecipient: { where: { status: 'completed' } },
    },
  });

  const scored: MatchResult[] = candidates.map((c) => {
    const theirTeachIds = new Set(c.skillsTeach.map((s) => s.skillId));
    const theirLearnIds = new Set(c.skillsLearn.map((s) => s.skillId));

    // (1) Skill overlap — A teaches what B wants × B teaches what A wants
    const aTeachesBWants = [...myTeachIds].filter((id) => theirLearnIds.has(id)).length;
    const bTeachesAWants = [...theirTeachIds].filter((id) => myLearnIds.has(id)).length;
    const overlapScore = (aTeachesBWants + bTeachesAWants) * 30; // up to 60 pts

    // (2) Rating average (0-5 → 0-20 pts)
    const ratings = c.reviewsReceived.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 3;
    const ratingScore = (avgRating / 5) * 20;

    // (3) Recency of activity (last 30 days = full points)
    const daysSinceActive = (Date.now() - c.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 10 - daysSinceActive / 3); // up to 10 pts

    // (4) Total swaps completed (up to 10 pts)
    const totalSwaps = c.swapsAsRequester.length + c.swapsAsRecipient.length;
    const swapScore = Math.min(10, totalSwaps * 0.5);

    const score = Math.round(overlapScore + ratingScore + recencyScore + swapScore);

    const teachSkillNames = c.skillsTeach.map((s) => s.skill.name);
    const learnSkillNames = c.skillsLearn.map((s) => s.skill.name);

    // Build a human-readable reason (will be replaced by AI for top N)
    const sharedTeach = c.skillsTeach
      .filter((s) => myLearnIds.has(s.skillId))
      .map((s) => s.skill.name);
    const sharedLearn = c.skillsLearn
      .filter((s) => myTeachIds.has(s.skillId))
      .map((s) => s.skill.name);

    const matchReason =
      sharedTeach.length && sharedLearn.length
        ? `${c.name} teaches ${sharedTeach.join(', ')} and wants ${sharedLearn.join(', ')} — exactly what you offer.`
        : sharedTeach.length
        ? `${c.name} teaches ${sharedTeach.join(', ')}, which you want to learn.`
        : sharedLearn.length
        ? `${c.name} wants to learn ${sharedLearn.join(', ')}, which you can teach.`
        : 'Explore their profile — they might be a great swap partner.';

    return {
      userId: c.id,
      name: c.name,
      avatarUrl: c.avatarUrl,
      collegeName: c.collegeName,
      bio: c.bio,
      score,
      teachSkills: teachSkillNames,
      learnSkills: learnSkillNames,
      avgRating: Math.round(avgRating * 10) / 10,
      totalSwaps,
      matchReason,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
