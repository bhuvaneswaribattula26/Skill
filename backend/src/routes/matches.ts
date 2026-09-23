// src/routes/matches.ts
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireVerified } from '../middleware/auth';
import { computeMatches } from '../utils/matchScore';
import { generateMatchExplanations } from '../lib/ai';
import { config } from '../config';

const router = Router();

// GET /api/v1/matches
router.get('/', requireAuth, requireVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matches = await computeMatches(req.user!.userId);
    const topN = config.ai.explainTopN;

    // Generate AI explanations only for top N to control API cost
    if (matches.length > 0) {
      const topMatches = matches.slice(0, topN);
      const pairs = topMatches.map((m) => ({
        userAName: 'you',
        userBName: m.name,
        reason: m.matchReason,
      }));

      const explanations = await generateMatchExplanations(pairs);
      topMatches.forEach((m, i) => {
        m.aiExplanation = explanations[i];
      });
    }

    res.json(matches);
  } catch (err) {
    next(err);
  }
});

export default router;
