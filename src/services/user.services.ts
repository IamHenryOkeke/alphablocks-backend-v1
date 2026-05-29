import * as userQueries from "../db/user.queries";
import { getStartedEmail } from "../email-templates";
import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import { redis } from "../lib/redis";
import { getStartedSchema } from "../lib/schemas";
import { emailQueue } from "../queues/email.queue";
import { queueConfig } from "../utils/queue-config";
import z from "zod";

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

export const getStarted = async (data: z.infer<typeof getStartedSchema>) => {
  const { isSubscribed, ...rest } = data;
  const existingUserByEmail = await userQueries.getUserByEmail(data.email);

  if (existingUserByEmail) throw new AppError("Email is in use already", 400);

  const newUser = await userQueries.createUser({
    ...rest,
    isSubscribed: isSubscribed === "YES" ? true : false,
  });

  await emailQueue.add(
    "send-get-started-email",
    {
      subject: "Welcome to Alphablocks",
      to: newUser.email,
      content: getStartedEmail(newUser.name),
    },
    queueConfig,
  );

  return newUser;
};
