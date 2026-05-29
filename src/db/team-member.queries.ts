import { AppError } from "../error/errorHandler";
import { Prisma, PrismaClient, Role } from "../generated/prisma/client";
import prisma from "../lib/prisma";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type GetUsersArgs = {
  where?: Prisma.TeamMemberWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.TeamMemberOrderByWithRelationInput;
};

export async function getAllTeamMembers(
  { where, take, skip, orderBy }: GetUsersArgs,
  role?: Role,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const isSuperAdmin = role === "SUPERADMIN";

    const [members, total] = await Promise.all([
      tx.teamMember.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          title: true,
          category: true,
          linkedInUrl: true,
          twitterUrl: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              ...(isSuperAdmin && { role: true }),
            },
          },
        },
      }),
      tx.teamMember.count({ where }),
    ]);

    return {
      members,
      total,
      totalPage: take ? Math.ceil(total / take) : 1,
      page: skip && take ? Math.ceil(skip / take) + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occurred while finding team members:",
        error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getTeamStats(tx: PrismaTransactionClient = prisma) {
  try {
    const [total, invited] = await Promise.all([
      tx.teamMember.count({
        where: { deletedAt: null },
      }),
      tx.teamMember.count({
        where: {
          deletedAt: null,
          user: { role: "USER" },
        },
      }),
    ]);

    return {
      total,
      active: total - invited,
      invited,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while fetching team stats", error.message);
    } else {
      console.error("Error occured while fetching team stats", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getTeamMemberById(
  id: string,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.teamMember.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occured while finding team member by id",
        error.message,
      );
    } else {
      console.error("Error occured while finding team member by id", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getTeamMemberByUserId(
  userId: string,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.teamMember.findUnique({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occured while finding team member by user id",
        error.message,
      );
    } else {
      console.error(
        "Error occured while finding team member by user id",
        error,
      );
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createTeamMember(
  values: Prisma.TeamMemberCreateInput,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.teamMember.create({
      data: values,
      include: {
        user: true,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new team member:", error.message);
    } else {
      console.error("Error creating new team member:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateTeamMember(
  id: string,
  values: Prisma.TeamMemberUpdateInput,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.teamMember.update({
      where: { id },
      data: values,
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating team member:", error.message);
    } else {
      console.error("Error updating team member:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteTeamMember(
  id: string,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.teamMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        user: {
          update: {
            role: "USER",
            password: null,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting team member:", error.message);
    } else {
      console.error("Error deleting team member:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}
