import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type GetUsersArgs = {
  where?: Prisma.TeamMemberWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.TeamMemberOrderByWithRelationInput;
};

export async function getAllTeamMembers({
  where,
  take,
  skip,
  orderBy,
}: GetUsersArgs) {
  try {
    const [users, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          title: true,
          category: true,
          linkedinUrl: true,
          twitterUrl: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.teamMember.count({ where }),
    ]);

    return {
      users,
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

export async function getTeamMemberById(id: string) {
  try {
    const data = await prisma.teamMember.findUnique({
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

export async function getTeamMemberByUserId(userId: string) {
  try {
    const data = await prisma.teamMember.findUnique({
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

export async function createTeamMember(values: Prisma.TeamMemberCreateInput) {
  try {
    const data = await prisma.teamMember.create({
      data: values,
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
) {
  try {
    const data = await prisma.teamMember.update({
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

export async function deleteTeamMember(id: string) {
  try {
    const data = await prisma.teamMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
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
