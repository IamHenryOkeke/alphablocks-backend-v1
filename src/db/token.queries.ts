import { AppError } from "../error/errorHandler";
import { Prisma, TokenType } from "../generated/prisma/client";
import prisma from "../lib/prisma";

export async function createToken(values: Prisma.TokenCreateInput) {
  try {
    const data = await prisma.token.create({
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

export async function getToken(token: string, type: TokenType) {
  try {
    const data = await prisma.token.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
        type,
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

export async function deleteToken(userId: string) {
  try {
    const data = await prisma.token.deleteMany({
      where: {
        userId,
      },
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
