// src/middleware/rateLimit.ts — Redis-backed rate limiter
import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../lib/redis';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const redis = await getRedis();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const prefix = opts.keyPrefix || 'rl';
    const key = `${prefix}:${ip}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, opts.windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', opts.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.maxRequests - count));

      if (count > opts.maxRequests) {
        res.status(429).json({
          error: 'Too many requests — please slow down.',
          retryAfterSeconds: opts.windowSeconds,
        });
        return;
      }
      next();
    } catch {
      // If rate limiter fails, allow the request through
      next();
    }
  };
}

// Presets
export const authRateLimit = rateLimit({ windowSeconds: 60, maxRequests: 10, keyPrefix: 'rl:auth' });
export const swapRateLimit = rateLimit({ windowSeconds: 60, maxRequests: 5, keyPrefix: 'rl:swap' });
export const generalRateLimit = rateLimit({ windowSeconds: 60, maxRequests: 60, keyPrefix: 'rl:api' });
