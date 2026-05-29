import * as cohortQueries from "../db/cohort.queries";
import * as ticketQueries from "../db/ticket.queries";
import { AppError } from "../error/errorHandler";
import { PaymentStatus, Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { redis } from "../lib/redis";
import generateTrxReference from "../utils/ref";
import fetchWithRetry from "../utils/fetchWithRetry";
import { createHash, createHmac } from "crypto";
import { emailQueue } from "../queues/email.queue";
import { queueConfig } from "../utils/queue-config";
import { successCohortRegistration } from "../email-templates";
import { getEnv } from "../config/env";
import {
  invalidateCache,
  buildResourceCacheTargets,
} from "../utils/redis-cache";

const BASE_URL =
  getEnv("NODE_ENV") === "development"
    ? "http://localhost:3000/"
    : "https://www.alphablocks.tech/";
const PAYSTACK_SECRET = getEnv("PAYSTACK_SECRET_KEY")!;
export type PublicationFilter = "all" | "published" | "draft";
export type DateFilter = "all" | "upcoming" | "ongoing" | "ended";

export const getCohortStats = async () => {
  const cacheKey = "cohorts:stats";
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const stats = await cohortQueries.getCohortStats();

  await redis.set(cacheKey, JSON.stringify(stats), { EX: 60 });
  return stats;
};

export const buildPublicationWhere = (
  user: Express.User | null,
  filter: PublicationFilter,
) => {
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  if (!isAdmin) {
    return { isPublished: true };
  }

  switch (filter) {
    case "published":
      return { isPublished: true };
    case "draft":
      return { isPublished: false };
    case "all":
    default:
      return {};
  }
};

export const buildDateWhere = (filter: DateFilter) => {
  const now = new Date();
  switch (filter) {
    case "upcoming":
      return { startDate: { gt: now } };
    case "ongoing":
      return { startDate: { lte: now }, endDate: { gte: now } };
    case "ended":
      return { endDate: { lt: now } };
    case "all":
    default:
      return {};
  }
};

export const getAllCohorts = async (
  user: Express.User | null,
  queryParams: {
    searchTerm: string;
    page: number;
    limit: number;
    publication: PublicationFilter;
    dateFilter: DateFilter;
  },
) => {
  const { searchTerm, page, limit, publication, dateFilter } = queryParams;

  const cachePayload = {
    role: user?.role ?? "USER",
    searchTerm: searchTerm?.trim().toLowerCase() ?? null,
    page,
    limit,
    publication,
    dateFilter,
  };
  const cacheKey = `cohorts:all:${JSON.stringify(cachePayload)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const where: Prisma.CohortWhereInput = {
    deletedAt: null,
    ...(searchTerm && {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }),
    ...buildPublicationWhere(user, publication),
    ...buildDateWhere(dateFilter),
  };

  const orderBy = { publishedAt: "desc" as const };

  const cohorts = await cohortQueries.getAllCohorts({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy,
  });

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

  const cohort = await cohortQueries.getLatestCohort(values);

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
  console.log(user);
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

export const getCohortParticipants = async (
  user: Express.User | null,
  cohortId: string,
) => {
  const cacheKey = `cohorts:participants:${cohortId}:${user?.role ?? "USER"}`;
  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const values = {
    id: cohortId,
    deletedAt: null,
  };

  const cohort = await cohortQueries.getCohort(values, user?.role);

  if (!cohort) throw new AppError("Cohort not found", 404);

  const participants = await cohortQueries.getCohortParticipants(cohortId);

  await redis.set(cacheKey, JSON.stringify(participants), {
    EX: 60 * 5,
  });

  return participants;
};

export const registerCohort = async (
  cohortId: string,
  data: Prisma.UserCreateInput,
) => {
  const cohort = await cohortQueries.getCohort({
    id: cohortId,
    deletedAt: null,
  });
  if (!cohort) throw new AppError("Cohort not found", 404);

  const { email, name, phoneNumber, gender } = data;

  const idempotencyKey = createHash("sha256")
    .update(`${email}-${cohortId}`)
    .digest("hex");

  const existingTicket = await ticketQueries.getCohortTicket({
    idempotencyKey,
  });

  if (existingTicket && existingTicket.initializedAt) {
    if (existingTicket.status === PaymentStatus.COMPLETED) {
      throw new AppError("Cohort already paid for", 400);
    }

    // Paystack authorization URLs typically expire ~30min after creation.
    // Only reuse if we're well within that window.
    const PAYSTACK_URL_TTL_MS = 25 * 60 * 1000;
    const ticketAge = Date.now() - existingTicket.initializedAt.getTime();
    const isReusable =
      existingTicket.status === PaymentStatus.PENDING &&
      existingTicket.authorizationUrl &&
      ticketAge < PAYSTACK_URL_TTL_MS;

    if (isReusable) {
      return {
        authorizationUrl: existingTicket.authorizationUrl,
        reference: existingTicket.trxRef,
        ticketId: existingTicket.id,
      };
    }
  }

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.cohortTicket.deleteMany({ where: { idempotencyKey } });

    const user = await tx.user.upsert({
      where: { email },
      update: {
        name: name,
        ...(phoneNumber && { phoneNumber }),
        ...(gender && { gender }),
      },
      create: {
        name,
        email,
        phoneNumber,
        gender,
      },
    });

    const participant = await tx.participant.upsert({
      where: {
        cohortId_userId: { cohortId, userId: user.id },
      },
      update: {},
      create: { cohortId, userId: user.id },
    });

    return tx.cohortTicket.create({
      data: {
        trxRef: generateTrxReference(),
        amount: "150000",
        ownerId: participant.id,
        idempotencyKey,
        cohortId,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        initializedAt: new Date(),
      },
    });
  });

  const callbackUrl = new URL(
    `cohort-programmes/${cohortId}/register`,
    BASE_URL,
  ).toString();
  const cancelUrl = new URL(
    `cohort-programmes/${cohortId}`,
    BASE_URL,
  ).toString();

  try {
    const response = await fetchWithRetry(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          email: email,
          amount: "150000",
          reference: ticket.trxRef,
          callback_url: callbackUrl,
          metadata: {
            cancel_action: cancelUrl,
            ticketId: ticket.id,
          },
          channels: ["card", "bank"],
        }),
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      },
      3,
      1000,
    );

    const paystackData = await response.json();

    if (!response.ok || !paystackData.data?.authorization_url) {
      throw new AppError(
        paystackData.message || "Failed to initialize Paystack transaction",
        502,
      );
    }

    const { authorization_url, reference: confirmedReference } =
      paystackData.data;

    // Persist the authorization URL so future idempotent retries can reuse it
    await prisma.cohortTicket.update({
      where: { id: ticket.id },
      data: { authorizationUrl: authorization_url },
    });

    await invalidateCache(buildResourceCacheTargets("cohorts", cohortId));

    return {
      authorizationUrl: authorization_url,
      reference: confirmedReference,
      ticketId: ticket.id,
    };
  } catch (err) {
    // Covers both non-OK responses AND thrown network errors from fetchWithRetry
    await prisma.cohortTicket
      .update({
        where: { id: ticket.id },
        data: { status: PaymentStatus.FAILED },
      })
      .catch(() => {
        // Don't mask the original error if the status update also fails
      });

    if (err instanceof AppError) throw err;
    throw new AppError("Failed to initialize payment", 500);
  }
};

export const createCohort = async (data: Prisma.CohortCreateInput) => {
  const { slug } = data;

  const existingCohort = await cohortQueries.getCohort({ slug });

  if (existingCohort)
    throw new AppError(`Cohort with this name already exists`, 400);

  const newCohort = await cohortQueries.createCohort(data);

  if (!newCohort) throw new AppError("Failed to create event", 400);

  await invalidateCache(buildResourceCacheTargets("cohorts"));

  return newCohort;
};

export const updateCohort = async (
  cohortId: string,
  data: Prisma.CohortUpdateInput,
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

  await invalidateCache(buildResourceCacheTargets("cohorts", cohortId));

  return updatedCohort;
};

export const deleteCohort = async (cohortId: string) => {
  const existingCohort = await cohortQueries.getCohort({
    id: cohortId,
  });

  if (!existingCohort) throw new AppError("Event not found", 404);

  const deletedCohort = await cohortQueries.deleteCohort(cohortId);

  await invalidateCache(buildResourceCacheTargets("cohorts", cohortId));

  return deletedCohort;
};

export const webhook = async (data: Buffer, signature: string) => {
  const computedSignature = createHmac("sha512", PAYSTACK_SECRET)
    .update(data)
    .digest("hex");

  if (computedSignature !== signature)
    throw new AppError("Invalid Paystack signature", 401);

  const event = JSON.parse(data.toString("utf-8"));

  if (event.event === "charge.success") {
    const ticketId = event.data.metadata?.ticketId;
    if (!ticketId) throw new AppError("Ticket ID missing in metadata", 400);

    try {
      const data = await ticketQueries.updateCohortTicket(ticketId, {
        status: PaymentStatus.COMPLETED,
      });

      const { owner, cohort } = data;

      await emailQueue.add(
        "send-payment-confirmation-email",
        {
          subject: "Payment confirmation",
          to: owner.user.email,
          content: successCohortRegistration(
            owner.user.name,
            cohort?.title,
            cohort?.thumbnailImage,
            cohort.whatsappGroupUrl,
          ),
        },
        queueConfig,
      );

      return {
        statusCode: 200,
        message: "Payment verified and payment status updated",
      };
    } catch (err) {
      console.error("Error processing Paystack webhook:", err);
      throw new AppError("Error processing payment", 500);
    }
  }
};
