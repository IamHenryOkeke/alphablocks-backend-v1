import { AppError } from "../error/errorHandler";
import { Prisma, TokenType } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { PrismaTransactionClient } from "./team-member.queries";

export async function createToken(
  values: Prisma.TokenCreateInput,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.token.create({
      data: values,
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating token:", error.message);
    } else {
      console.error("Error creating token:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getToken(
  token: string,
  type: TokenType,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.token.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
        type,
      },
      include: {
        user: true,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error getting token:", error.message);
    } else {
      console.error("Error getting token:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteToken(
  userId: string,
  type: TokenType,
  tx: PrismaTransactionClient = prisma,
) {
  try {
    const data = await tx.token.deleteMany({
      where: {
        userId,
        type,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting token:", error.message);
    } else {
      console.error("Error deleting token:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}
