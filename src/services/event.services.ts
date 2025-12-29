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
  const cacheKey = `events:all:${JSON.stringify({
    searchTerm: searchTerm ?? null,
    page,
    limit,
    role: user?.role ?? "USER",
  })}`;

  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const where: Prisma.EventWhereInput = {
    deletedAt: null,
    ...(!user || user.role === "USER" || user.role === "CONTRIBUTOR"
      ? {
          isPublished: true,
        }
      : {
          creator: { role: user.role },
        }),
    ...(searchTerm && {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }),
  };

  const events = await eventQueries.getAllEvents({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      ...(!user || user.role === "USER" || user.role === "CONTRIBUTOR"
        ? { publishedAt: "desc" }
        : { createdAt: "desc" }),
    },
  });

  await redis.set(cacheKey, JSON.stringify(events), {
    EX: 60 * 5,
  });

  return events;
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
    ...(!user || user.role === "USER" || user.role === "CONTRIBUTOR"
      ? {
          isPublished: true,
          deletedAt: null,
        }
      : {
          creator: { role: user.role },
        }),
  };

  const event = await eventQueries.getEventByIdOrSlug(values);

  if (!event) throw new AppError("Event not found", 404);

  await redis.set(cacheKey, JSON.stringify(event), {
    EX: 60 * 5,
  });

  return event;
};

export const createEvent = async (eventData: Prisma.EventCreateInput) => {
  const { slug } = eventData;

  const existingEvent = await eventQueries.getEventByIdOrSlug({ slug });

  if (existingEvent) {
    throw new AppError("Event with this name already exists", 400);
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
  const existingEvent = await eventQueries.getEventByIdOrSlug({
    id: eventId,
  });

  if (!existingEvent) throw new AppError("Event not found", 404);

  const { slug } = data;

  if (slug && typeof slug === "string") {
    const eventWithSlug = await eventQueries.getEventByIdOrSlug({ slug });
    if (eventWithSlug && eventWithSlug.id !== eventId)
      throw new AppError("Event with this name already exists", 400);
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
  const existingEvent = await eventQueries.getEventByIdOrSlug({
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
