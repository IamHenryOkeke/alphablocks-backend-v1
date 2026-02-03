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

const BASE_URL =
  getEnv("NODE_ENV") === "development"
    ? "http://localhost:3000/"
    : "https://www.alphablocks.tech/";
const PAYSTACK_SECRET = getEnv("PAYSTACK_SECRET_KEY")!;

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
  if (cached) return JSON.parse(cached);

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
    .update(`${email.trim().toLowerCase()}-${cohortId}`)
    .digest("hex");

  const existingTicket = await ticketQueries.getCohortTicket({
    idempotencyKey,
  });

  if (existingTicket) {
    if (existingTicket.status === PaymentStatus.COMPLETED)
      throw new AppError("Cohort already paid for", 400);

    const isExpired =
      !existingTicket.expiresAt ||
      existingTicket.expiresAt.getTime() < Date.now();

    if (!isExpired && existingTicket.authorizationUrl)
      return {
        authorizationUrl: existingTicket.authorizationUrl,
        reference: existingTicket.trxRef,
        ticketId: existingTicket.id,
      };
  }

  await ticketQueries.deleteCohortTicket({
    where: { idempotencyKey },
  });

  const ticket = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {
        name: name.trim(),
        phoneNumber: (phoneNumber || "").trim(),
        gender,
      },
      create: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: (phoneNumber || "").trim(),
        gender,
      },
    });

    const participant = await tx.participant.create({
      data: {
        cohortId: cohortId,
        userId: user.id,
      },
    });

    const trxRef = generateTrxReference();

    const newCohortTicket = await tx.cohortTicket.create({
      data: {
        trxRef: trxRef,
        amount: "150000",
        ownerId: participant.id,
        idempotencyKey,
        cohortId,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        initializedAt: new Date(Date.now()),
      },
      include: {
        owner: {
          select: {
            user: true,
          },
        },
      },
    });

    return newCohortTicket;
  });

  if (!ticket) throw new AppError("Failed to create ticket", 400);

  const params = JSON.stringify({
    email: ticket.owner.user.email,
    amount: "150000",
    reference: ticket.trxRef,
    callback_url: `${BASE_URL}cohort-programmes/${cohortId}/register`,
    metadata: {
      cancel_action: `${BASE_URL}cohort-programmes/${cohortId}`,
      ticketId: ticket.id,
    },
    channels: ["card", "bank"],
  });

  const response = await fetchWithRetry(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      body: params,
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
    await prisma.cohortTicket.update({
      where: { id: ticket.id },
      data: { status: "FAILED" },
    });

    throw new AppError(
      paystackData.message || "Failed to initialize Paystack transaction",
      500,
    );
  }

  const { authorization_url, reference: confirmedReference } =
    paystackData.data;

  return {
    authorizationUrl: authorization_url,
    reference: confirmedReference,
    ticketId: ticket.id,
  };
};

export const createCohort = async (data: Prisma.CohortCreateInput) => {
  const { slug } = data;

  const existingCohort = await cohortQueries.getCohort({ slug });

  if (existingCohort)
    throw new AppError(`Cohort with this name already exists`, 400);

  const newCohort = await cohortQueries.createCohort(data);

  if (!newCohort) throw new AppError("Failed to create event", 400);

  const keys = await redis.keys("cohort:all:*");
  if (keys.length) await redis.del(keys);

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

  const keys = await redis.keys(`cohorts:id:${cohortId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("cohorts:all:*");
  if (allKeys.length) await redis.del(allKeys);

  return updatedCohort;
};

export const deleteCohort = async (eventId: string) => {
  const existingEvent = await cohortQueries.getCohort({
    id: eventId,
  });

  if (!existingEvent) throw new AppError("Event not found", 404);

  const deletedEvent = await cohortQueries.deleteCohort(eventId);

  const keys = await redis.keys(`events:id:${eventId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("events:all:*");
  if (allKeys.length) await redis.del(allKeys);

  return deletedEvent;
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
          title: "Payment confirmation",
          to: owner.user.email,
          name: owner.user.name,
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
