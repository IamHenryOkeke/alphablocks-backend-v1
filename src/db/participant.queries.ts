import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type GetParticipantsArgs = {
  where?: Prisma.ParticipantWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.ParticipantOrderByWithRelationInput;
};

export async function getAllParticipants({
  where,
  take,
  skip,
  orderBy,
}: GetParticipantsArgs) {
  try {
    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          cohortTicket: {
            select: {
              status: true,
              trxRef: true,
              amount: true,
            },
          },
        },
      }),
      prisma.participant.count({ where }),
    ]);

    return {
      participants,
      total,
      totalPage: take ? Math.ceil(total / take) : 1,
      page: skip && take ? Math.ceil(skip / take) + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occurred while finding participants:",
        error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getParticipant(
  values: Prisma.ParticipantWhereUniqueInput,
) {
  try {
    const data = await prisma.participant.findUnique({
      where: values,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        cohortTicket: {
          select: {
            status: true,
            trxRef: true,
            amount: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occured while finding participant by id",
        error.message,
      );
    } else {
      console.error("Error occured while finding participant by id", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createParticipant(values: Prisma.ParticipantCreateInput) {
  try {
    const data = await prisma.participant.create({
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new participant:", error.message);
    } else {
      console.error("Error creating new participant:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateParticipant(
  id: string,
  values: Prisma.ParticipantUpdateInput,
) {
  try {
    const data = await prisma.participant.update({
      where: { id },
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating participant:", error.message);
    } else {
      console.error("Error updating participant:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteParticipant(id: string) {
  try {
    const data = await prisma.participant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
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
