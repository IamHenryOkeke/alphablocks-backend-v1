import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type GetUsersArgs = {
  where?: Prisma.UserWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.UserOrderByWithRelationInput;
};

export async function getAllUsers({
  where,
  take,
  skip,
  orderBy,
}: GetUsersArgs) {
  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
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

export async function getUserByEmail(email: string) {
  try {
    const data = await prisma.user.findUnique({
      where: {
        email,
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

export async function getUserById(id: string) {
  try {
    const data = await prisma.user.findUnique({
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

export async function getUserByGoogleId(googleId: string) {
  try {
    const data = await prisma.user.findUnique({
      where: {
        googleId,
        deletedAt: null,
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occured while finding user by google id",
        error.message,
      );
    } else {
      console.error("Error occured while finding user by google id", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createUser(values: Prisma.UserCreateInput) {
  try {
    const data = await prisma.user.create({
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

export async function updateUser(id: string, values: Prisma.UserUpdateInput) {
  try {
    const data = await prisma.user.update({
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

export async function deleteUser(id: string) {
  try {
    const data = await prisma.user.update({
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
