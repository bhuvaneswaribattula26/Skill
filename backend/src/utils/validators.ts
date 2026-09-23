// src/utils/validators.ts — domain check + shared Zod schemas
import { config } from '../config';
import { z } from 'zod';

/**
 * Check if an email's domain matches the allow-list.
 * Pattern: "*.edu.in" matches "student@srmist.edu.in"
 */
export function isAllowedEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  return config.allowedEmailDomains.some((pattern) => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // ".edu.in"
      return domain.endsWith(suffix);
    }
    return domain === pattern;
  });
}

// ─── Zod schemas ──────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  collegeName: z.string().min(2).max(200).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  collegeName: z.string().max(200).optional(),
});

export const addSkillSchema = z.object({
  skillId: z.string().cuid().optional(),
  skillName: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
}).refine((d) => d.skillId || d.skillName, { message: 'Either skillId or skillName is required' });

export const createSwapSchema = z.object({
  recipientId: z.string().cuid(),
  skillId: z.string().cuid().optional(),
  message: z.string().max(500).optional(),
});

export const updateSwapSchema = z.object({
  status: z.enum(['accepted', 'declined', 'cancelled']),
});

export const createSessionSchema = z.object({
  swapRequestId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  meetingLink: z.string().url().optional(),
});

export const createReviewSchema = z.object({
  sessionId: z.string().cuid(),
  revieweeId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});
