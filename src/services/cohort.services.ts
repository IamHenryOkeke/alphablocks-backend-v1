import * as cohortQueries from "../db/cohort.queries";
import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import { redis } from "../lib/redis";

export const getAllCohorts = async (
  user: Express.User | null,
  queryParams: {
    searchTerm: string;
    page: number;
    limit: number;
  },
) => {
  const { searchTerm, page, limit } = queryParams;

  const cachePayload = {
    role: user?.role ?? "USER",
    searchTerm: searchTerm?.trim().toLowerCase() ?? null,
    page: page,
    limit: limit,
  };

  const cacheKey = `cohorts:all:${JSON.stringify(cachePayload)}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const where: Prisma.CohortWhereInput = {
    deletedAt: null,
    ...(searchTerm && {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }),
    ...(user?.role !== "ADMIN" &&
      user?.role !== "SUPERADMIN" && {
        isPublished: true,
      }),
  };

  const orderBy =
    user?.role === "ADMIN" || user?.role === "SUPERADMIN"
      ? { createdAt: "desc" as const }
      : { publishedAt: "desc" as const };

  const cohorts = await cohortQueries.getAllCohorts(
    {
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    },
    user?.role ?? "USER",
  );

  await redis.set(cacheKey, JSON.stringify(cohorts), {
    EX: 60 * 5,
  });

  return cohorts;
};

export const getLatestCohort = async (user: Express.User | null) => {
  const cacheKey = `cohorts:latest:${user?.role ?? "USER"}`;
  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const values = {
    deletedAt: null,
    ...(user?.role !== "ADMIN" &&
      user?.role !== "SUPERADMIN" && {
        isPublished: true,
      }),
  };

  const cohort = await cohortQueries.getLatestCohort(values, user?.role);

  if (!cohort) throw new AppError("Latest cohort not found", 404);

  await redis.set(cacheKey, JSON.stringify(cohort), {
    EX: 60 * 5,
  });

  return cohort;
};

export const getCohortById = async (
  user: Express.User | null,
  cohortId: string,
) => {
  const cacheKey = `cohorts:id:${cohortId}:${user?.role ?? "USER"}`;

  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const values = {
    id: cohortId,
    deletedAt: null,
    ...((!user || user.role === "USER" || user.role === "CONTRIBUTOR") && {
      isPublished: true,
    }),
  };

  const cohort = await cohortQueries.getCohort(values, user?.role);

  if (!cohort) throw new AppError("Cohort not found", 404);

  await redis.set(cacheKey, JSON.stringify(cohort), {
    EX: 60 * 5,
  });

  return cohort;
};

export const createCohort = async (data: Prisma.CohortCreateInput) => {
  const { slug } = data;

  const existingCohort = await cohortQueries.getCohort({ slug });

  if (existingCohort) {
    throw new AppError(`Cohort with this name already exists`, 400);
  }

  const newCohort = await cohortQueries.createCohort(data);

  if (!newCohort) {
    throw new AppError("Failed to create event", 400);
  }

  const keys = await redis.keys("cohort:all:*");
  if (keys.length) {
    await redis.del(keys);
  }

  return newCohort;
};

export const updateCohort = async (
  cohortId: string,
  data: Prisma.EventUpdateInput,
) => {
  const existingCohort = await cohortQueries.getCohort({
    id: cohortId,
  });

  if (!existingCohort) throw new AppError("Cohort not found", 404);

  const { slug } = data;

  if (slug && typeof slug === "string") {
    const cohortWithSlug = await cohortQueries.getCohort({ slug });
    if (cohortWithSlug && cohortWithSlug.id !== cohortId)
      throw new AppError(
        `Cohort with title '${data.title}' already exists`,
        400,
      );
  }

  const updatedCohort = await cohortQueries.updateCohort(cohortId, data);

  const keys = await redis.keys(`cohorts:id:${cohortId}:*`);
  if (keys.length) {
    await redis.del(keys);
  }

  const allKeys = await redis.keys("cohorts:all:*");
  if (allKeys.length) {
    await redis.del(allKeys);
  }

  return updatedCohort;
};

export const deleteCohort = async (eventId: string) => {
  const existingEvent = await cohortQueries.getCohort({
    id: eventId,
  });

  if (!existingEvent) {
    throw new AppError("Event not found", 404);
  }

  const deletedEvent = await cohortQueries.deleteCohort(eventId);

  const keys = await redis.keys(`events:id:${eventId}:*`);
  if (keys.length) {
    await redis.del(keys);
  }

  const allKeys = await redis.keys("events:all:*");
  if (allKeys.length) {
    await redis.del(allKeys);
  }

  return deletedEvent;
};
