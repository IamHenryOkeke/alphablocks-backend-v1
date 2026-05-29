import { AppError } from "../error/errorHandler";
import { PaymentStatus, Prisma, Role } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type GetCohortsArgs = {
  where?: Prisma.CohortWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.CohortOrderByWithRelationInput;
};

const koboToNaira = (kobo: number) => kobo / 100;

export async function getAllCohorts({
  where,
  take,
  skip,
  orderBy,
}: GetCohortsArgs) {
  try {
    const [cohorts, total] = await Promise.all([
      prisma.cohort.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailImage: true,
          startDate: true,
          endDate: true,
          publishedAt: true,
        },
      }),
      prisma.cohort.count({ where }),
    ]);

    return {
      cohorts,
      total,
      totalPage: take ? Math.ceil(total / take) : 1,
      page: skip && take ? Math.ceil(skip / take) + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occurred while finding cohorts:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getCohortStats() {
  const now = new Date();
  const notDeleted: Prisma.CohortWhereInput = { deletedAt: null };

  const [
    total,
    published,
    drafts,
    upcoming,
    ongoing,
    ended,
    totalParticipants,
    completedTickets,
  ] = await Promise.all([
    prisma.cohort.count({ where: notDeleted }),
    prisma.cohort.count({ where: { ...notDeleted, isPublished: true } }),
    prisma.cohort.count({ where: { ...notDeleted, isPublished: false } }),
    prisma.cohort.count({
      where: { ...notDeleted, isPublished: true, startDate: { gt: now } },
    }),
    prisma.cohort.count({
      where: {
        ...notDeleted,
        isPublished: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.cohort.count({
      where: { ...notDeleted, isPublished: true, endDate: { lt: now } },
    }),
    prisma.participant.count({
      where: { deletedAt: null, cohort: notDeleted },
    }),
    prisma.cohortTicket.findMany({
      where: { status: PaymentStatus.COMPLETED },
      select: { amount: true },
    }),
  ]);

  const totalRevenue = koboToNaira(
    completedTickets.reduce((s, t) => s + Number(t.amount || 0), 0),
  );

  return {
    total,
    published,
    drafts,
    upcoming,
    ongoing,
    ended,
    totalParticipants,
    totalRevenue,
    currency: "NGN",
  };
}

export async function getLatestCohort(
  values: Prisma.CohortFindFirstArgs["where"],
) {
  try {
    const data = await prisma.cohort.findMany({
      where: values,
      select: {
        id: true,
        title: true,
        thumbnailImage: true,
        description: true,
        startDate: true,
        endDate: true,
        venue: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 1,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occurred while finding latest cohort:",
        error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getCohort(
  values: Prisma.CohortWhereUniqueInput,
  role?: Role,
) {
  try {
    const data = await prisma.cohort.findUnique({
      where: values,
      select: {
        id: true,
        title: true,
        thumbnailImage: true,
        description: true,
        details: true,
        startDate: true,
        endDate: true,
        venue: true,
        publishedAt: true,
        classTime: true,
        nftLiveStatus: true,
        ...((role === "ADMIN" || role === "SUPERADMIN") && {
          isPublished: true,
          whatsappGroupUrl: true,
          creatorId: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          nftCertificateUrl: true,
        }),
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding cohort by id", error.message);
    } else {
      console.error("Error occured while finding cohort by id", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getCohortParticipants(cohortId: string) {
  try {
    const data = await prisma.participant.findMany({
      where: { cohortId, deletedAt: null },
      select: {
        id: true,
        walletAddress: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        cohortTicket: {
          select: {
            trxRef: true,
            amount: true,
            status: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occured while finding cohort participants",
        error.message,
      );
    } else {
      console.error("Error occured while finding cohort participants", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createCohort(values: Prisma.CohortCreateInput) {
  try {
    const data = await prisma.cohort.create({
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new cohort:", error.message);
    } else {
      console.error("Error creating new cohort:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateCohort(
  id: string,
  values: Prisma.CohortUpdateInput,
) {
  try {
    const data = await prisma.cohort.update({
      where: { id },
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating cohort:", error.message);
    } else {
      console.error("Error updating cohort:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteCohort(id: string) {
  try {
    const data = await prisma.cohort.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting cohort:", error.message);
    } else {
      console.error("Error deleting cohort:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}
