// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Supabase's transaction pooler (port 6543) can be unavailable on IPv4-only
// development networks. When a local direct/session URL is configured, use it
// for the development app too; production continues to use DATABASE_URL.
if (process.env.NODE_ENV === 'development' && process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
