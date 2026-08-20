import type { Redis } from "ioredis";

export interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[];
}

export interface LockResult {
  acquired: boolean;
  lockKey: string;
  token?: string | undefined;
  release: () => Promise<boolean>;
}

export class CacheClient {
  private readonly redis: Redis;
  private readonly defaultTtl: number;

  constructor(redis: Redis, defaultTtlSeconds = 300) {
    this.redis = redis;
    this.defaultTtl = defaultTtlSeconds;
  }

  /**
   * Format key with mandatory namespace prefix.
   */
  private formatKey(namespace: string, key: string): string {
    return `jaago:${namespace}:${key}`;
  }

  /**
   * Retrieve parsed JSON from cache.
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const raw = await this.redis.get(this.formatKey(namespace, key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Store structured value with TTL.
   */
  async set<T>(namespace: string, key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttlSeconds ?? this.defaultTtl;
    const formattedKey = this.formatKey(namespace, key);
    const serialized = JSON.stringify(value);

    if (ttl > 0) {
      await this.redis.set(formattedKey, serialized, "EX", ttl);
    } else {
      await this.redis.set(formattedKey, serialized);
    }

    // Index tags if present
    if (options?.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await this.redis.sadd(`jaago:tag:${tag}`, formattedKey);
      }
    }
  }

  /**
   * Delete a key.
   */
  async del(namespace: string, key: string): Promise<void> {
    await this.redis.del(this.formatKey(namespace, key));
  }

  /**
   * Invalidate all keys matching a specific tag.
   */
  async invalidateTag(tag: string): Promise<number> {
    const tagKey = `jaago:tag:${tag}`;
    const keys = await this.redis.smembers(tagKey);
    if (keys.length === 0) return 0;

    await this.redis.del(...keys);
    await this.redis.del(tagKey);
    return keys.length;
  }

  /**
   * Acquire a single-flight distributed lock with TTL.
   */
  async acquireLock(resource: string, ttlSeconds = 10): Promise<LockResult> {
    const lockKey = this.formatKey("lock", resource);
    const token = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const result = await this.redis.set(lockKey, token, "EX", ttlSeconds, "NX");
    const acquired = result === "OK";

    const release = async (): Promise<boolean> => {
      // Lua script for atomic check-and-delete
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const res = await this.redis.eval(script, 1, lockKey, token);
      return res === 1;
    };

    return {
      acquired,
      lockKey,
      token: acquired ? token : undefined,
      release,
    };
  }

  /**
   * Stale-While-Revalidate (SWR) cache helper.
   */
  async swr<T>(
    namespace: string,
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(namespace, key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(namespace, key, fresh, options);
    return fresh;
  }
}
