import { redis } from "../lib/redis";

export const deleteByPattern = async (
  pattern: string,
  batchSize = 100,
): Promise<void> => {
  let cursor = "0";

  do {
    const result = await redis.scan(cursor, {
      MATCH: pattern,
      COUNT: batchSize,
    });

    cursor = result.cursor;

    if (result.keys.length) {
      await redis.del(result.keys);
    }
  } while (cursor !== "0");
};

export type CacheInvalidationTargets = {
  patterns?: string[];
  exact?: string[];
};

export const invalidateCache = async (
  targets: CacheInvalidationTargets,
): Promise<void> => {
  const { patterns = [], exact = [] } = targets;

  const tasks: Promise<unknown>[] = [
    ...patterns.map((pattern) => deleteByPattern(pattern)),
    ...(exact.length ? [redis.del(exact)] : []),
  ];

  await Promise.all(tasks);
};

export const buildResourceCacheTargets = (
  namespace: string,
  resourceId?: string,
): CacheInvalidationTargets => {
  const patterns = [`${namespace}:all:*`, `${namespace}:latest:*`];

  if (resourceId) {
    patterns.push(`${namespace}:id:${resourceId}:*`);
    patterns.push(`${namespace}:participants:${resourceId}:*`);
  }

  return {
    patterns,
    exact: [`${namespace}:stats`],
  };
};
