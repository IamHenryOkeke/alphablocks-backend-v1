import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { PrismaTransactionClient } from "./team-member.queries";

type GetUsersArgs = {
  where?: Prisma.UserWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.UserOrderByWithRelationInput;
};

export async function getAllUsers(
  { where, take, skip, orderBy }: GetUsersArgs,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const [users, total] = await Promise.all([
      tx.user.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          gender: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      tx.user.count({ where }),
    ]);

    return {
      users,
      total,
      totalPage: take ? Math.ceil(total / take) : 1,
      page: skip && take ? Math.ceil(skip / take) + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occurred while finding users:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getUserByEmail(
  email: string,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
      include: {
        teamMember: true,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding user by email", error.message);
    } else {
      console.error("Error occured while finding user by email", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getUserByGoogleId(
  email: string,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.user.findUnique({
      where: {
        googleId,
        deletedAt: null,
      },
      include: {
        teamMember: true,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding user by email", error.message);
    } else {
      console.error("Error occured while finding user by email", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getUserById(
  id: string,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        teamMember: true,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding user by id", error.message);
    } else {
      console.error("Error occured while finding user by id", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createUser(
  values: Prisma.UserCreateInput,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.user.create({
      data: values,
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new user:", error.message);
    } else {
      console.error("Error creating new user:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateUser(
  id: string,
  values: Prisma.UserUpdateInput,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.user.update({
      where: { id },
      data: values,
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating user:", error.message);
    } else {
      console.error("Error updating user:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteUser(
  id: string,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting user:", error.message);
    } else {
      console.error("Error deleting user:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}
