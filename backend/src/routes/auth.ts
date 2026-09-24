// src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { sendEmail, verificationEmailHtml } from '../lib/email';
import { isAllowedEmailDomain, registerSchema, loginSchema } from '../utils/validators';
import { loginRateLimit, registerRateLimit } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';

const router = Router();

function signAccess(userId: string, email: string, isAdmin: boolean) {
  return jwt.sign({ userId, email, isAdmin }, config.jwt.accessSecret, {
    // jsonwebtoken's type accepts only its duration-string union, not a plain string.
    expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
  });
}

function signRefresh(userId: string) {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    jwtid: uuidv4(),
  });
}

// POST /api/v1/auth/register
router.post('/register', registerRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    if (!isAllowedEmailDomain(data.email)) {
      res.status(400).json({
        error: `Only college email addresses are allowed (e.g. ${config.allowedEmailDomains.join(', ')})`,
      });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const needsEmailVerification = !config.isDev;
    const verifyToken = needsEmailVerification ? uuidv4() : null;
    const verifyExpires = needsEmailVerification ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        collegeName: data.collegeName || '',
        passwordHash,
        verifyToken,
        verifyExpires,
        isVerified: !needsEmailVerification,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      },
    });

    if (needsEmailVerification) {
      const verifyUrl = `${config.frontendUrl}#/verify-email?token=${verifyToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Verify your SkillSwap Campus email',
        html: verificationEmailHtml(user.name, verifyUrl),
      });
    }

    res.status(201).json({
      message: needsEmailVerification
        ? 'Account created! Check your email to verify your account.'
        : 'Account created! You can now log in.',
      userId: user.id,
      emailVerificationRequired: needsEmailVerification,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) { res.status(400).json({ error: 'Token required' }); return; }

    const user = await prisma.user.findUnique({ where: { verifyToken: token } });
    if (!user || !user.verifyExpires || user.verifyExpires < new Date()) {
      res.status(400).json({ error: 'Invalid or expired verification token' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null, verifyExpires: null },
    });

    // Give welcome credits
    await prisma.creditTransaction.create({
      data: { userId: user.id, amount: 10, reason: 'Welcome bonus — email verified' },
    });

    const accessToken = signAccess(user.id, user.email, user.isAdmin);
    const refreshToken = signRefresh(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ message: 'Email verified!', accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', loginRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) { res.status(401).json({ error: 'Invalid email or password' }); return; }
    if (user.isSuspended) { res.status(403).json({ error: 'Account suspended' }); return; }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    // Local development does not depend on an external email provider. Existing
    // development accounts created before this behavior are upgraded on login.
    let isVerified = user.isVerified;
    if (config.isDev && !isVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
      isVerified = true;
    }

    // Update last active
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    const accessToken = signAccess(user.id, user.email, user.isAdmin);
    const refreshToken = signRefresh(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        collegeName: user.collegeName,
        isVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }

    let payload: { userId: string };
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Refresh token revoked or expired' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isSuspended) {
      res.status(403).json({ error: 'Account not accessible' });
      return;
    }

    // Rotate refresh token
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const newRefresh = signRefresh(user.id);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefresh,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = signAccess(user.id, user.email, user.isAdmin);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user!.userId },
        data: { revoked: true },
      });
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

export default router;
