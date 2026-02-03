import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import { CohortTicketDeleteArgs } from "../generated/prisma/models";
import prisma from "../lib/prisma";

type GetCohortTicketsArgs = {
  where?: Prisma.CohortTicketWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.CohortTicketOrderByWithRelationInput;
};

export async function getAllCohortTickets({
  where,
  take,
  skip,
  orderBy,
}: GetCohortTicketsArgs) {
  try {
    const [cohortTickets, total] = await Promise.all([
      prisma.cohortTicket.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          owner: {
            select: {
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.cohortTicket.count({ where }),
    ]);

    return {
      cohortTickets,
      total,
      totalPage: take ? Math.ceil(total / take) : 1,
      page: skip && take ? Math.ceil(skip / take) + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occurred while finding cohort tickets:",
        error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getCohortTicket(
  values: Prisma.CohortTicketWhereUniqueInput,
) {
  try {
    const data = await prisma.cohortTicket.findUnique({
      where: values,
      include: {
        owner: {
          select: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding cohort ticket", error.message);
    } else {
      console.error("Error occured while finding cohort ticket", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createCohortTicket(
  values: Prisma.CohortTicketCreateInput,
) {
  try {
    const data = await prisma.cohortTicket.create({
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new cohort ticket:", error.message);
    } else {
      console.error("Error creating new cohort ticket:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateCohortTicket(
  id: string,
  values: Prisma.CohortTicketUpdateInput,
) {
  try {
    const data = await prisma.cohortTicket.update({
      where: { id },
      data: values,
      include: {
        owner: {
          select: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        cohort: {
          select: {
            title: true,
            thumbnailImage: true,
            whatsappGroupUrl: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating cohort ticket:", error.message);
    } else {
      console.error("Error updating cohort ticket:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteCohortTicket(value: CohortTicketDeleteArgs) {
  try {
    const data = await prisma.cohortTicket.delete(value);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting participant:", error.message);
    } else {
      console.error("Error deleting participant:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}
