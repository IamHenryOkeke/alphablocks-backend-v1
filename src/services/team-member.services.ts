import z from "zod";
import * as teamMemberQueries from "../db/team-member.queries";
import * as userQueries from "../db/user.queries";
import * as tokenQueries from "../db/token.queries";
import { adminInviteEmail, deleteTeamMemberEmail } from "../email-templates";
import { AppError } from "../error/errorHandler";
import { Prisma, TokenType } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { redis } from "../lib/redis";
import { emailQueue } from "../queues/email.queue";
import { queueConfig } from "../utils/queue-config";
import { createTeamMemberSchema, updateTeamMemberSchema } from "../lib/schemas";
import { generateToken } from "../utils/crypto";
import { getEnv } from "../config/env";

export const getTeamStats = async () => {
  const cacheKey = "team-members:stats";
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const stats = await teamMemberQueries.getTeamStats();

  await redis.set(cacheKey, JSON.stringify(stats), { EX: 60 * 5 });
  return stats;
};

export const getAllTeamMembers = async (
  user: Express.User | undefined,
  queryParams: {
    searchTerm: string;
    page: number;
    limit: number;
    type: string;
  },
) => {
  const { searchTerm, page, limit, type } = queryParams;
  const role = user?.role ?? "USER";

  const cachePayload = {
    role,
    searchTerm: searchTerm || null,
    page,
    limit,
    type,
  };
  const cacheKey = `team-members:all:${JSON.stringify(cachePayload)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const where: Prisma.TeamMemberWhereInput = {
    deletedAt: null,
    ...(searchTerm && {
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
      ],
    }),
    ...(type === "active" && {
      user: { role: { in: ["ADMIN", "SUPERADMIN"] } },
    }),
    ...(type === "invited" && {
      user: { role: "USER" },
    }),
  };

  const members = await teamMemberQueries.getAllTeamMembers(
    {
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    },
    user?.role,
  );

  await redis.set(cacheKey, JSON.stringify(members), { EX: 60 * 5 });

  return members;
};

export const getTeamMemberById = async (memberId: string) => {
  const cacheKey = `team-members:id:${memberId}`;

  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const member = await teamMemberQueries.getTeamMemberById(memberId);

  if (!member) throw new AppError("Team member not found", 404);

  await redis.set(cacheKey, JSON.stringify(member), {
    EX: 60 * 5,
  });

  return member;
};

export const createTeamMember = async (
  data: z.infer<typeof createTeamMemberSchema>,
) => {
  const { title, linkedInUrl, twitterUrl, email, category, image } = data;
  const { raw, hashed } = generateToken();

  const newMember = await prisma.$transaction(async (tx) => {
    const user = await userQueries.getUserByEmail(email, tx);

    if (!user) throw new AppError("User not found", 404);
    if (
      user.teamMember &&
      (user.role === "SUPERADMIN" || user.role === "ADMIN")
    )
      throw new AppError("User is already a team member", 409);

    if (user.teamMember && user.role === "USER") {
      await tokenQueries.deleteToken(user.id, TokenType.INVITE_TEAM_MEMBER, tx);
      await tokenQueries.createToken(
        {
          type: TokenType.INVITE_TEAM_MEMBER,
          expires: new Date(Date.now() + 72 * 60 * 60 * 1000),
          token: hashed,
          user: { connect: { id: user.id } },
        },
        tx,
      );

      return { ...user, reinvited: true };
    }

    const data = await userQueries.updateUser(
      user.id,
      {
        image,
        tokens: {
          create: {
            type: TokenType.INVITE_TEAM_MEMBER,
            expires: new Date(Date.now() + 72 * 60 * 60 * 1000),
            token: hashed,
          },
        },
        teamMember: {
          create: {
            title,
            category,
            ...(twitterUrl && { twitterUrl }),
            ...(linkedInUrl && { linkedInUrl }),
          },
        },
      },
      tx,
    );

    return { ...data, reinvited: false };
  });

  if (!newMember) throw new AppError("Failed to create member", 400);

  const keys = await redis.keys("team-members:all:*");
  if (keys.length) await redis.del(keys);

  const inviteUrl = `${getEnv("FRONTEND_URL")}/teckkk/admin/auth/accept-invite?token=${raw}`;

  await emailQueue.add(
    "send-invite-email",
    {
      subject: newMember.reinvited
        ? "Reminder: Invitation to Join the Team"
        : "Invitation to Join the Team",
      to: newMember.email,
      content: adminInviteEmail(newMember.name, inviteUrl),
    },
    queueConfig,
  );
  return newMember;
};

export const updateTeamMember = async (
  memberId: string,
  data: z.infer<typeof updateTeamMemberSchema>,
) => {
  const { title, linkedInUrl, twitterUrl, category, image } = data;

  console.log(data);

  const updatedMember = await prisma.$transaction(async (tx) => {
    const teamMember = await teamMemberQueries.getTeamMemberById(memberId, tx);

    if (!teamMember) throw new AppError("Team member not found", 404);

    const data = await userQueries.updateUser(
      teamMember.userId,
      {
        ...(image && { image }),
        teamMember: {
          update: {
            ...(title && { title }),
            ...(category && { category }),
            ...(twitterUrl && { twitterUrl }),
            ...(linkedInUrl && { linkedInUrl }),
          },
        },
      },
      tx,
    );

    return data;
  });

  if (!updatedMember) throw new AppError("Failed to update member", 400);

  const keys = await redis.keys(`team-members:id:${memberId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("team-members:all:*");
  if (allKeys.length) await redis.del(allKeys);

  return updatedMember;
};

export const deleteTeamMember = async (memberId: string) => {
  const existingMember = await teamMemberQueries.getTeamMemberById(memberId);
  if (!existingMember) throw new AppError("Member not found", 404);

  const deletedTeamMember = await teamMemberQueries.deleteTeamMember(memberId);

  const keys = await redis.keys(`team-members:id:${memberId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("team-members:all:*");
  if (allKeys.length) await redis.del(allKeys);

  await redis.del("team-members:stats");

  await emailQueue.add(
    "send-delete-member-email",
    {
      subject: "Changes to Your Alphablocks Team Role",
      to: deletedTeamMember.user.email,
      content: deleteTeamMemberEmail(deletedTeamMember.user.name),
    },
    queueConfig,
  );

  return deletedTeamMember;
};
