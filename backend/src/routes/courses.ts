import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../config';

const router = Router();

// GET /api/v1/courses?q=python
// Keeps the YouTube key on the server and returns only course-safe display data.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const query = rawQuery || 'popular beginner programming course';
    const requestedLimit = Number(req.query.limit || 8);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 12) : 8;

    if (!config.youtube.apiKey) {
      res.status(503).json({ error: 'Course search is not configured yet.' });
      return;
    }

    const params = new URLSearchParams({
      key: config.youtube.apiKey,
      part: 'snippet',
      type: 'video',
      maxResults: String(limit),
      q: `${query} course tutorial`,
      videoEmbeddable: 'true',
      safeSearch: 'strict',
      relevanceLanguage: 'en',
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const payload = await response.json() as {
      error?: { message?: string };
      items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; description?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string }; high?: { url?: string } } } }>;
    };

    if (!response.ok) {
      console.error('[Courses] YouTube API:', payload.error?.message || response.status);
      res.status(502).json({ error: 'Course search is temporarily unavailable. Please try again.' });
      return;
    }

    const courses = (payload.items || [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        id: item.id!.videoId!,
        title: item.snippet?.title || 'Untitled course video',
        description: item.snippet?.description || '',
        instructor: item.snippet?.channelTitle || 'YouTube creator',
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
        url: `https://www.youtube.com/watch?v=${item.id!.videoId!}`,
      }));
    res.json({ query, courses });
  } catch (error) {
    next(error);
  }
});

export default router;
