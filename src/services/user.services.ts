import * as userQueries from "../db/user.queries";
import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import { redis } from "../lib/redis";

export const getAllUsers = async (queryParams: {
  searchTerm: string;
  page: number;
  limit: number;
}) => {
  const { searchTerm, page, limit } = queryParams;

  const cachePayload = {
    searchTerm: searchTerm?.trim().toLowerCase() ?? null,
    page: page,
    limit: limit,
  };

  const cacheKey = `users:all:${JSON.stringify(cachePayload)}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(searchTerm && {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }),
  };

  const users = await userQueries.getAllUsers({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  await redis.set(cacheKey, JSON.stringify(users), {
    EX: 60 * 5,
  });

  return users;
};

export const getUserById = async (userId: string) => {
  const cacheKey = `users:id:${userId}`;

  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const user = await userQueries.getUserById(userId);

  if (!user) throw new AppError("User not found", 404);

  await redis.set(cacheKey, JSON.stringify(user), {
    EX: 60 * 5,
  });

  return user;
};
