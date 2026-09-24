// src/lib/redis.ts — Redis client with in-memory fallback for local dev
import { config } from '../config';

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<unknown>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  quit(): Promise<unknown>;
}

// Simple in-memory fallback when Redis is not configured
class MemoryStore implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  private isExpired(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return true;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string) {
    if (this.isExpired(key)) return null;
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, _mode?: string, duration?: number) {
    const expiresAt = duration ? Date.now() + duration * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string) {
    return this.set(key, value, 'EX', seconds);
  }

  async del(key: string) {
    this.store.delete(key);
    return 1;
  }

  async incr(key: string) {
    const val = parseInt((await this.get(key)) || '0', 10) + 1;
    const existing = this.store.get(key);
    this.store.set(key, { value: String(val), expiresAt: existing?.expiresAt });
    return val;
  }

  async expire(key: string, seconds: number) {
    const entry = this.store.get(key);
    if (entry) entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async quit() { return 'OK'; }
}

let redisClient: RedisLike;

async function createRedisClient(): Promise<RedisLike> {
  if (!config.redis.url) {
    console.warn('[Redis] No REDIS_URL — using in-memory fallback');
    return new MemoryStore();
  }
  try {
    const { default: Redis } = await import('ioredis');
    // Redis is optional in this project. Never make a student wait through
    // ioredis's long default retry window when a local/old REDIS_URL is down.
    const client = new Redis(config.redis.url, {
      lazyConnect: true,
      connectTimeout: 750,
      commandTimeout: 750,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    // The fallback below handles the failure; consuming the event prevents
    // ioredis from printing a noisy unhandled-error message to the server log.
    client.on('error', () => undefined);
    await client.ping();
    console.log('[Redis] Connected');
    return client as unknown as RedisLike;
  } catch (err) {
    console.warn('[Redis] Connection failed — using in-memory fallback:', (err as Error).message);
    return new MemoryStore();
  }
}

export async function getRedis(): Promise<RedisLike> {
  if (!redisClient) redisClient = await createRedisClient();
  return redisClient;
}
