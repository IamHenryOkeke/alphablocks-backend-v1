import * as tokenQueries from "../db/token.queries";
import * as userQueries from "../db/user.queries";
import { AppError } from "../error/errorHandler";
import { TokenType } from "../generated/prisma/enums";
import { emailQueue } from "../queues/email.queue";
import { createToken } from "../utils/crypto";
import { comparePassword, hashPassword } from "../utils/hash";
import { signJWT } from "../utils/jwt";
import { queueConfig } from "../utils/queue-config";

export const signUp = async (data: {
  email: string;
  password: string;
  name: string;
}) => {
  const normalizedEmail = data.email.toLowerCase();

  const existingUserByEmail = await userQueries.getUserByEmail(normalizedEmail);

  if (existingUserByEmail) {
    throw new AppError("Email already used. Please use another email.", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const values = {
    email: normalizedEmail,
    password: hashedPassword,
    name: data.name.trim(),
  };

  const newUser = await userQueries.createUser(values);

  await tokenQueries.deleteToken(newUser.id);

  const token = createToken();

  await tokenQueries.createToken({
    token,
    expires: new Date(Date.now() + 60 * 10 * 1000),
    user: {
      connect: {
        id: newUser.id,
      },
    },
    type: TokenType.EMAIL_VERIFICATION,
  });

  const verificationLink = `${process.env.FRONTEND_URL}/verify-account?token=${token}`;

  await emailQueue.add(
    "send-welcome-email",
    {
      title: "Welcome to AlphaBlocks!",
      to: newUser.email,
      name: newUser.name,
      content: `
        <div>
          <p>Hello ${newUser.name || newUser.email},</p>
          <p>Welcome to AlphaBlocks! We're excited to have you on board.</p>
          <p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>
          <p>Link expires in 10 minutes</p>
        </div>
      `,
    },
    queueConfig,
  );

  const user = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
  };

  return user;
};

export const logIn = async (email: string, password: string) => {
  const isExistingUser = await userQueries.getUserByEmail(email.toLowerCase());

  if (!isExistingUser || isExistingUser.deletedAt) {
    throw new AppError("invalid credentials", 401);
  }

  if (!isExistingUser.password) {
    if (isExistingUser.googleId) {
      throw new AppError("Please login with Google.", 400);
    }
    throw new AppError("Invalid credentials", 401);
  }

  if (!isExistingUser.isVerified) {
    await tokenQueries.deleteToken(isExistingUser.id);

    const token = createToken();

    await tokenQueries.createToken({
      token,
      expires: new Date(Date.now() + 60 * 10 * 1000),
      user: {
        connect: {
          id: isExistingUser.id,
        },
      },
      type: TokenType.EMAIL_VERIFICATION,
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-account?token=${token}`;

    await emailQueue.add(
      "send-verification-email",
      {
        title: "Verify Your account!",
        to: isExistingUser.email,
        name: isExistingUser.name,
        content: `
          <div>
            <p>Hello ${isExistingUser.name || isExistingUser.email},</p>
            <p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>
          </div>
        `,
      },
      queueConfig,
    );

    throw new AppError("Please verify your account before logging in.", 403);
  }

  const isValidPassword = await comparePassword(
    isExistingUser.password,
    password.trim(),
  );

  if (!isValidPassword) {
    throw new AppError("invalid credentials", 401);
  }

  const user = {
    id: isExistingUser.id,
    name: isExistingUser.name,
    email: isExistingUser.email,
    role: isExistingUser.role,
    image: isExistingUser.image,
    createdAt: isExistingUser.createdAt,
    updatedAt: isExistingUser.updatedAt,
  };

  const token = signJWT(user, 60 * 15);

  return { user, token };
};

export const sendVerificationEmail = async (email: string) => {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await userQueries.getUserByEmail(normalizedEmail);

  if (!existingUser || existingUser.deletedAt) {
    throw new AppError("Invalid credentials.", 401);
  }

  if (existingUser.isVerified) {
    throw new AppError("Account verified already", 409);
  }

  await tokenQueries.deleteToken(existingUser.id);

  const token = createToken();

  const values = {
    token,
    expires: new Date(Date.now() + 60 * 5 * 1000),
    user: {
      connect: {
        id: existingUser.id,
      },
    },
    type: TokenType.EMAIL_VERIFICATION,
  };

  await tokenQueries.createToken(values);

  const verificationLink = `${process.env.FRONTEND_URL}/verify-account?token=${token}`;

  await emailQueue.add(
    "send-verification-email",
    {
      title: "Verify Your account!",
      to: existingUser.email,
      name: existingUser.name,
      content: `
        <div>
          <p>Hello ${existingUser.name || existingUser.email},</p>
          <p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>
        </div>
      `,
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
  const existingToken = await tokenQueries.getToken(
    token,
    TokenType.EMAIL_VERIFICATION,
  );

  if (!existingToken) {
    throw new AppError("Reset token is invalid or has expired.", 400);
  }

  const user = await userQueries.getUserById(existingToken.userId);

  if (!user || user.deletedAt) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    return { message: "Account is already verified." };
  }

  const values = { isVerified: true };

  await userQueries.updateUser(user.id, values);

  return { message: "Account verification successful." };
};

export const sendResetPasswordEmail = async (email: string) => {
  const normalizedEmail = email.toLowerCase();

  const existingUserByEmail = await userQueries.getUserByEmail(normalizedEmail);

  if (!existingUserByEmail || existingUserByEmail.deletedAt) {
    throw new AppError("Invalid credentials.", 409);
  }

  await tokenQueries.deleteToken(existingUserByEmail.id);

  const token = createToken();

  const values = {
    token,
    expires: new Date(Date.now() + 60 * 5 * 1000),
    user: {
      connect: {
        id: existingUserByEmail.id,
      },
    },
    type: TokenType.PASSWORD_RESET,
  };

  await tokenQueries.createToken(values);

  const verificationLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await emailQueue.add(
    "send-password-reset-email",
    {
      title: "Reset Your Password!",
      to: existingUserByEmail.email,
      name: existingUserByEmail.name,
      content: `
        <div>
          <p>Hello ${existingUserByEmail.name},</p>
          <p>You requested to reset your password. Click the button below:</p>
          <p><a href="${verificationLink}" style="padding: 10px 15px; background: #007BFF; color: white; text-decoration: none;">Reset Password</a></p>
          <p>If you didn't request this, you can ignore this email.</p>
        </div>
      `,
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
  const existingToken = await tokenQueries.getToken(
    token,
    TokenType.PASSWORD_RESET,
  );

  if (!existingToken) {
    throw new AppError("Reset token is invalid or has expired.", 400);
  }

  const user = await userQueries.getUserById(existingToken.userId);

  if (!user || user.deletedAt) {
    throw new AppError("User not found", 404);
  }

  const hashedPassword = await hashPassword(password);

  await userQueries.updateUser(existingToken.userId, {
    password: hashedPassword,
  });

  await tokenQueries.deleteToken(existingToken.userId);

  return { message: "Password reset successful." };
};
