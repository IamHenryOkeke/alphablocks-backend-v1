import { AppError } from "../error/errorHandler";
import { Prisma, Role } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type GetCohortsArgs = {
  where?: Prisma.CohortWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.CohortOrderByWithRelationInput;
};

export async function getAllCohorts(
  { where, take, skip, orderBy }: GetCohortsArgs,
  role?: Role,
) {
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
            creatorId: true,
            deletedAt: true,
            createdAt: true,
            updatedAt: true,
          }),
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

export async function getLatestCohort(
  values: Prisma.CohortFindFirstArgs["where"],
  role?: Role,
) {
  try {
    const data = await prisma.cohort.findFirst({
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
          creatorId: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        }),
      },
      orderBy: {
        publishedAt: "desc",
      },
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
          creatorId: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
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
