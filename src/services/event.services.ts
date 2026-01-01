import * as eventQueries from "../db/event.queries";
import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import { redis } from "../lib/redis";

export const getAllEvents = async (
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

  const cacheKey = `events:all:${JSON.stringify(cachePayload)}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const where: Prisma.EventWhereInput = {
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

  const events = await eventQueries.getAllEvents(
    {
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    },
    user?.role ?? "USER",
  );

  await redis.set(cacheKey, JSON.stringify(events), {
    EX: 60 * 5,
  });

  return events;
};

export const getLatestEvent = async (user: Express.User | null) => {
  const cacheKey = `events:latest:${user?.role ?? "USER"}`;
  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const values = {
    deletedAt: null,
    ...(user?.role !== "ADMIN" &&
      user?.role !== "SUPERADMIN" && {
        isPublished: true,
      }),
  };

  const event = await eventQueries.getLatestEvent(values, user?.role);

  if (!event) throw new AppError("Latest Event not found", 404);

  await redis.set(cacheKey, JSON.stringify(event), {
    EX: 60 * 5,
  });

  return event;
};

export const getEventById = async (
  user: Express.User | null,
  eventId: string,
) => {
  const cacheKey = `events:id:${eventId}:${user?.role ?? "USER"}`;

  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const values = {
    id: eventId,
    deletedAt: null,
    ...((!user || user.role === "USER" || user.role === "CONTRIBUTOR") && {
      isPublished: true,
    }),
  };

  const event = await eventQueries.getEvent(values, user?.role);

  if (!event) throw new AppError("Event not found", 404);

  await redis.set(cacheKey, JSON.stringify(event), {
    EX: 60 * 5,
  });

  return event;
};

export const createEvent = async (eventData: Prisma.EventCreateInput) => {
  const { slug } = eventData;

  const existingEvent = await eventQueries.getEvent({ slug });

  if (existingEvent) {
    throw new AppError(`Event with this name already exists`, 400);
  }

  const newEvent = await eventQueries.createEvent(eventData);

  if (!newEvent) {
    throw new AppError("Failed to create event", 400);
  }

  const keys = await redis.keys("events:all:*");
  if (keys.length) {
    await redis.del(keys);
  }

  return newEvent;
};

export const updateEvent = async (
  eventId: string,
  data: Prisma.EventUpdateInput,
) => {
  const existingEvent = await eventQueries.getEvent({
    id: eventId,
  });

  if (!existingEvent) throw new AppError("Event not found", 404);

  const { slug } = data;

  if (slug && typeof slug === "string") {
    const eventWithSlug = await eventQueries.getEvent({ slug });
    if (eventWithSlug && eventWithSlug.id !== eventId)
      throw new AppError(
        `Event with title '${data.title}' already exists`,
        400,
      );
  }

  const updatedEvent = await eventQueries.updateEvent(eventId, data);

  const keys = await redis.keys(`events:id:${eventId}:*`);
  if (keys.length) {
    await redis.del(keys);
  }

  const allKeys = await redis.keys("events:all:*");
  if (allKeys.length) {
    await redis.del(allKeys);
  }

  return updatedEvent;
};

export const deleteEvent = async (eventId: string) => {
  const existingEvent = await eventQueries.getEvent({
    id: eventId,
  });

  if (!existingEvent) {
    throw new AppError("Event not found", 404);
  }

  const deletedEvent = await eventQueries.deleteEvent(eventId);

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
