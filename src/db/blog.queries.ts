import { AppError } from "../error/errorHandler";
import { Prisma, Role } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type GetBlogsArgs = {
  where?: Prisma.BlogPostWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Prisma.BlogPostOrderByWithRelationInput;
};

export async function getAllBlogPosts(
  { where, take, skip, orderBy }: GetBlogsArgs,
  role: Role,
) {
  try {
    const [blogPosts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          title: true,
          description: true,
          publishedAt: true,
          ...(role !== "USER"
            ? {
                isPublished: true,
                authorId: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true,
              }
            : {}),
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return {
      blogPosts,
      total,
      totalPage: take ? Math.ceil(total / take) : 1,
      page: skip && take ? Math.ceil(skip / take) + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occurred while finding getting all blog posts",
        error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getLatestBlogPost(
  values: Prisma.BlogPostFindFirstArgs["where"],
  role: Role,
) {
  try {
    const data = await prisma.blogPost.findFirst({
      where: values,
      select: {
        id: true,
        title: true,
        description: true,
        publishedAt: true,
        ...((role === "ADMIN" || role === "SUPERADMIN") && {
          creatorId: true,
          isPublished: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        }),
      },
      orderBy: {
        publishedAt: "desc",
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error occurred while finding latest blog post:",
        error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createBlogPost(values: Prisma.BlogPostCreateInput) {
  try {
    const data = await prisma.blogPost.create({
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new blog post:", error.message);
    } else {
      console.error("Error creating new blog post:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getBlogPost(
  values: Prisma.BlogPostWhereUniqueInput,
  role?: Role,
) {
  try {
    const data = await prisma.blogPost.findUnique({
      where: values,
      select: {
        id: true,
        title: true,
        description: true,
        publishedAt: true,
        ...(role !== "USER"
          ? {
              authorId: true,
              isPublished: true,
              createdAt: true,
              updatedAt: true,
            }
          : role !== "USER" && role !== "CoNTRIBUTOR"
            ? {
                deletedAt: true,
                author: { select: { id: true, name: true, email: true } },
              }
            : {}),
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error getting blog post by id:", error.message);
    } else {
      console.error("Error getting blog post by id:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateBlogPost(
  id: string,
  values: Partial<Prisma.BlogPostUpdateInput>,
) {
  try {
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: values,
    });

    return updatedPost;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new AppError("Blog post not found", 404);
      }
    }

    console.error("Error updating blog post:", error);
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteBlogPost(id: string) {
  try {
    const deletedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return deletedPost;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new AppError("Blog post not found", 404);
      }
    }

    console.error("Error updating blog post:", error);
    throw new AppError("Internal server error", 500);
  }
}
