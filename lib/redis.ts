// lib/redis.ts
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export const redis =
  global.__redis ??
  new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__redis = redis;
}
