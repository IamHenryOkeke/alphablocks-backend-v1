import * as teamMemberQueries from "../db/team-member.queries";
import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import { redis } from "../lib/redis";

export const getAllTeamMembers = async (queryParams: {
  searchTerm: string;
  page: number;
  limit: number;
}) => {
  const { searchTerm, page, limit } = queryParams;

  const cachePayload = {
    searchTerm: searchTerm?.trim().toLowerCase() ?? null,
    page: page,
    limit: limit,
  };

  const cacheKey = `team-members:all:${JSON.stringify(cachePayload)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const where: Prisma.TeamMemberWhereInput = {
    deletedAt: null,
    ...(searchTerm && {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }),
  };

  const members = await teamMemberQueries.getAllTeamMembers({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  await redis.set(cacheKey, JSON.stringify(members), {
    EX: 60 * 5,
  });

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

export const createTeamMember = async (data: Prisma.TeamMemberCreateInput) => {
  const { user } = data;

  if (user && "connect" in user && user.connect?.id) {
    const existingMember = await teamMemberQueries.getTeamMemberByUserId(
      user.connect.id,
    );
    if (existingMember) throw new AppError("This member already exists", 400);
  }

  const newMember = await teamMemberQueries.createTeamMember(data);

  if (!newMember) throw new AppError("Failed to create member", 400);

  const keys = await redis.keys("team-members:all:*");
  if (keys.length) await redis.del(keys);

  return newMember;
};

export const updateTeamMember = async (
  memberId: string,
  data: Prisma.TeamMemberUpdateInput,
) => {
  const existingMember = await teamMemberQueries.getTeamMemberById(memberId);
  if (!existingMember) throw new AppError("Member not found", 404);

  const { user } = data;
  if (user && "connect" in user && user.connect?.id) {
    if (user.connect.id !== existingMember.userId) {
      const userAlreadyHasMember =
        await teamMemberQueries.getTeamMemberByUserId(user.connect.id);
      if (userAlreadyHasMember)
        throw new AppError("This user already has a team member profile", 400);
    }
  }

  const updatedMember = await teamMemberQueries.updateTeamMember(
    memberId,
    data,
  );

  const keys = await redis.keys(`team-members:id:${memberId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("team-members:all:*");
  if (allKeys.length) await redis.del(allKeys);

  return updatedMember;
};

export const deleteUser = async (memberId: string) => {
  const existingMember = await teamMemberQueries.getTeamMemberById(memberId);
  if (!existingMember) throw new AppError("Member not found", 404);

  const deletedEvent = await teamMemberQueries.deleteTeamMember(memberId);

  const keys = await redis.keys(`team-members:id:${memberId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("team-members:all:*");
  if (allKeys.length) await redis.del(allKeys);

  return deletedEvent;
};
