import { getEnv } from "../config/env";
import * as tokenQueries from "../db/token.queries";
import * as userQueries from "../db/user.queries";
import { passwordResetEmail, verifyAccountEmail } from "../email-templates";
import { AppError } from "../error/errorHandler";
import { Role, TokenType } from "../generated/prisma/enums";
import prisma from "../lib/prisma";
import { redis } from "../lib/redis";
import { acceptInviteSchema } from "../lib/schemas";
import { emailQueue } from "../queues/email.queue";
import { generateToken } from "../utils/crypto";
import { comparePassword, hashPassword } from "../utils/hash";
import { signJWT } from "../utils/jwt";
import { queueConfig } from "../utils/queue-config";
import crypto from "crypto";
import z from "zod";

const FRONTEND_URL = getEnv("FRONTEND_URL");

export const acceptInvite = async (
  data: z.infer<typeof acceptInviteSchema>,
) => {
  const { token, password } = data;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const tokenRecord = await tokenQueries.getToken(
    hashedToken,
    TokenType.INVITE_TEAM_MEMBER,
  );

  if (!tokenRecord) throw new AppError("Invalid or expired invite", 400);
  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await userQueries.updateUser(tokenRecord.userId, {
      role: Role.ADMIN,
      password: hashedPassword,
      isVerified: true,
    });

    await tokenQueries.deleteToken(user.id, TokenType.INVITE_TEAM_MEMBER, tx);
  });

  const keys = await redis.keys("team-members:all:*");
  if (keys.length) await redis.del(keys);
  await redis.del("team-members:stats");

  return true;
};

export const logIn = async (email: string, password: string) => {
  const isExistingUser = await userQueries.getUserByEmail(email.toLowerCase());

  if (!isExistingUser) throw new AppError("invalid credentials", 401);

  if (!isExistingUser.password) throw new AppError("Invalid credentials", 401);

  if (!isExistingUser.isVerified) {
    await tokenQueries.deleteToken(
      isExistingUser.id,
      TokenType.EMAIL_VERIFICATION,
    );

    const { raw, hashed } = generateToken();

    await tokenQueries.createToken({
      token: hashed,
      expires: new Date(Date.now() + 60 * 10 * 1000),
      user: {
        connect: {
          id: isExistingUser.id,
        },
      },
      type: TokenType.EMAIL_VERIFICATION,
    });

    const verificationLink = `${FRONTEND_URL}/verify-account?token=${raw}`;

    await emailQueue.add(
      "send-verification-email",
      {
        subject: "Verify Your account!",
        to: isExistingUser.email,
        content: verifyAccountEmail(
          isExistingUser.name || isExistingUser.email,
          verificationLink,
        ),
      },
      queueConfig,
    );

    throw new AppError("Please verify your account before logging in.", 403);
  }

  const isValidPassword = await comparePassword(
    isExistingUser.password,
    password,
  );

  if (!isValidPassword) throw new AppError("invalid credentials", 401);

  const user = {
    id: isExistingUser.id,
    name: isExistingUser.name,
    email: isExistingUser.email,
    role: isExistingUser.role,
    image: isExistingUser.image,
    createdAt: isExistingUser.createdAt,
    updatedAt: isExistingUser.updatedAt,
  };

  const token = signJWT(user, 60 * 60);

  return { user, token };
};

export const sendVerificationEmail = async (email: string) => {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await userQueries.getUserByEmail(normalizedEmail);

  if (!existingUser || existingUser.deletedAt)
    throw new AppError("Invalid credentials.", 401);

  if (existingUser.isVerified)
    throw new AppError("Account verified already", 409);

  if (existingUser.role !== Role.ADMIN && existingUser.role !== Role.SUPERADMIN)
    throw new AppError("You are not authorized to access this resource", 403);

  await tokenQueries.deleteToken(existingUser.id, TokenType.EMAIL_VERIFICATION);

  const { raw, hashed } = generateToken();

  const values = {
    token: hashed,
    expires: new Date(Date.now() + 60 * 5 * 1000),
    user: {
      connect: {
        id: existingUser.id,
      },
    },
    type: TokenType.EMAIL_VERIFICATION,
  };

  await tokenQueries.createToken(values);

  const verificationLink = `${FRONTEND_URL}/verify-account?token=${raw}`;

  await emailQueue.add(
    "send-verification-email",
    {
      subject: "Verify Your account!",
      to: existingUser.email,
      content: verifyAccountEmail(
        existingUser.name || existingUser.email,
        verificationLink,
      ),
    },
    queueConfig,
  );

  return {
    message:
      "Verification email sent successful. Please check your email for a verification link",
    email,
  };
};

export const verifyEmail = async (token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const existingToken = await tokenQueries.getToken(
    hashedToken,
    TokenType.EMAIL_VERIFICATION,
  );

  if (!existingToken)
    throw new AppError("Reset token is invalid or has expired.", 400);

  if (existingToken.user.deletedAt) throw new AppError("User not found", 404);

  if (existingToken.user.isVerified)
    return { message: "Account is already verified." };

  if (
    existingToken.user.role !== Role.ADMIN &&
    existingToken.user.role !== Role.SUPERADMIN
  )
    throw new AppError("You are not authorized to access this resource", 403);

  const values = { isVerified: true };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingToken.userId },
        data: { isVerified: true },
      });
      await tx.token.deleteMany({
        where: {
          userId: existingToken.userId,
          type: TokenType.EMAIL_VERIFICATION,
        },
      });
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    throw new AppError("Failed to verify account. Please try again.", 500);
  }

  await userQueries.updateUser(existingToken.userId, values);

  return { message: "Account verification successful." };
};

export const sendResetPasswordEmail = async (email: string) => {
  const normalizedEmail = email.toLowerCase();

  const existingUserByEmail = await userQueries.getUserByEmail(normalizedEmail);

  if (!existingUserByEmail || existingUserByEmail.deletedAt)
    throw new AppError("Invalid credentials.", 409);

  if (
    existingUserByEmail.role !== Role.ADMIN &&
    existingUserByEmail.role !== Role.SUPERADMIN
  )
    throw new AppError("You are not authorized to access this resource", 403);

  await tokenQueries.deleteToken(
    existingUserByEmail.id,
    TokenType.PASSWORD_RESET,
  );

  const { raw, hashed } = generateToken();

  const values = {
    token: hashed,
    expires: new Date(Date.now() + 60 * 5 * 1000),
    user: {
      connect: {
        id: existingUserByEmail.id,
      },
    },
    type: TokenType.PASSWORD_RESET,
  };

  await tokenQueries.createToken(values);

  const verificationLink = `${FRONTEND_URL}teckkk/admin/auth/reset-password?token=${raw}`;

  await emailQueue.add(
    "send-password-reset-email",
    {
      subject: "Reset Your Password!",
      to: existingUserByEmail.email,
      content: passwordResetEmail(
        existingUserByEmail.name || existingUserByEmail.email,
        verificationLink,
      ),
    },
    queueConfig,
  );

  return {
    message: "Password reset email sent successful. Please check your email",
  };
};

export const resetPassword = async (data: {
  token: string;
  password: string;
}) => {
  const { token, password } = data;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const existingToken = await tokenQueries.getToken(
    hashedToken,
    TokenType.PASSWORD_RESET,
  );

  if (!existingToken)
    throw new AppError("Reset token is invalid or has expired.", 400);

  if (existingToken.user.deletedAt) throw new AppError("User not found", 404);

  const hashedPassword = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingToken.userId },
        data: { password: hashedPassword },
      });
      await tx.token.deleteMany({
        where: {
          userId: existingToken.userId,
          type: TokenType.PASSWORD_RESET,
        },
      });
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    throw new AppError("Failed to reset password. Please try again.", 500);
  }

  return { message: "Password reset successful." };
};
