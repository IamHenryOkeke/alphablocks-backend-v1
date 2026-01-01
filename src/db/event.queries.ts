import { AppError } from "../error/errorHandler";
import { Prisma, Role } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type GetEventsArgs = {
  where?: Prisma.EventWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.EventOrderByWithRelationInput;
};

export async function getAllEvents(
  { where, take, skip, orderBy }: GetEventsArgs,
  role?: Role,
) {
  try {
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          title: true,
          description: true,
          details: true,
          startDate: true,
          endDate: true,
          location: true,
          publishedAt: true,
          ...(role === "ADMIN" || role === "SUPERADMIN"
            ? {
                isPublished: true,
                creatorId: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true,
              }
            : {}),
          eventImages: {
            select: {
              imageUrl: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      total,
      totalPage: take ? Math.ceil(total / take) : 1,
      page: skip && take ? Math.ceil(skip / take) + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occurred while finding events:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getLatestEvent(
  values: Prisma.EventFindFirstArgs["where"],
  role?: Role,
) {
  try {
    const data = await prisma.event.findFirst({
      where: values,
      select: {
        id: true,
        title: true,
        description: true,
        details: true,
        startDate: true,
        endDate: true,
        location: true,
        publishedAt: true,
        ...(role === "ADMIN" || role === "SUPERADMIN"
          ? {
              creatorId: true,
              isPublished: true,
              deletedAt: true,
              createdAt: true,
              updatedAt: true,
            }
          : {}),
        eventImages: {
          select: {
            imageUrl: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occurred while finding latest event:",
        error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getEvent(
  values: Prisma.EventWhereUniqueInput,
  role?: Role,
) {
  try {
    const data = await prisma.event.findUnique({
      where: values,
      select: {
        id: true,
        title: true,
        description: true,
        details: true,
        startDate: true,
        endDate: true,
        location: true,
        publishedAt: true,
        ...(role === "ADMIN" || role === "SUPERADMIN"
          ? {
              creatorId: true,
              isPublished: true,
              deletedAt: true,
              createdAt: true,
              updatedAt: true,
            }
          : {}),
        eventImages: {
          select: {
            imageUrl: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding event by id", error.message);
    } else {
      console.error("Error occured while finding event by id", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createEvent(values: Prisma.EventCreateInput) {
  try {
    const data = await prisma.event.create({
      data: values,
      include: {
        eventImages: true,
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new event:", error.message);
    } else {
      console.error("Error creating new event:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateEvent(id: string, values: Prisma.EventUpdateInput) {
  try {
    const data = await prisma.event.update({
      where: { id },
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating event:", error.message);
    } else {
      console.error("Error updating event:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteEvent(id: string) {
  try {
    const data = await prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting event:", error.message);
    } else {
      console.error("Error deleting event:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}
