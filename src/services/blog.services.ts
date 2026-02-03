import * as blogQueries from "../db/blog.queries";
import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma/client";
import { redis } from "../lib/redis";

export const getAllBlogPosts = async (
  user: Express.User | null,
  queryParams: {
    searchTerm: string;
    page: number;
    limit: number;
  },
) => {
  const { searchTerm, page, limit } = queryParams;

  const cachePayload = {
    role: user?.role ?? "USER",
    userId: user?.role === "CONTRIBUTOR" ? user.id : null,
    searchTerm: searchTerm?.trim().toLowerCase() ?? null,
    page: page ?? 1,
    limit: limit ?? 10,
  };

  const cacheKey = `blogs:all:${JSON.stringify(cachePayload)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const where: Prisma.BlogPostWhereInput = {
    deletedAt: null,
    ...(!user || user.role === "USER"
      ? {
          isPublished: true,
        }
      : user.role === "CONTRIBUTOR"
        ? {
            author: { id: user.id },
          }
        : {}),
    ...(searchTerm && {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }),
  };

  const orderBy =
    user?.role === "ADMIN" || user?.role === "SUPERADMIN"
      ? { createdAt: "desc" as const }
      : { publishedAt: "desc" as const };

  const posts = await blogQueries.getAllBlogPosts(
    {
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    },
    user?.role ?? "USER",
  );

  await redis.set(cacheKey, JSON.stringify(posts), {
    EX: 60 * 5,
  });

  return posts;
};

export const getLatestBlogPost = async (user: Express.User | null) => {
  const cacheKey = `blogs:latest:${user?.role ?? "USER"}`;

  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const values = {
    deletedAt: null,
    ...(!user || user.role === "USER" || user.role === "CONTRIBUTOR"
      ? {
          isPublished: true,
        }
      : {}),
  };

  const post = await blogQueries.getLatestBlogPost(
    values,
    user?.role ?? "USER",
  );

  if (!post) throw new AppError("Latest post not found", 404);

  await redis.set(cacheKey, JSON.stringify(post), {
    EX: 60 * 5,
  });

  return post;
};

export const getBlogPostById = async (
  user: Express.User | null,
  blogId: string,
) => {
  const cacheKey = `blogs:id:${blogId}:${user?.role ?? "USER"}${user?.role === "CONTRIBUTOR" ? `:userId:${user.id}` : ""}`;

  const cacheData = await redis.get(cacheKey);

  if (cacheData) return JSON.parse(cacheData);

  const values = {
    id: blogId,
    deletedAt: null,
    ...(user?.role === "USER" && { isPublished: true }),
    ...(user?.role === "CONTRIBUTOR" && { authorId: user.id }),
  };

  const post = await blogQueries.getBlogPost(values, user?.role ?? "USER");

  if (!post) throw new AppError("Blog post not found", 404);

  await redis.set(cacheKey, JSON.stringify(post), {
    EX: 60 * 5,
  });

  return post;
};

export const createBlogPost = async (
  user: Express.User | null,
  blogPostData: Prisma.BlogPostCreateInput,
) => {
  const { slug } = blogPostData;

  const existingPost = await blogQueries.getBlogPost(
    { slug },
    user?.role ?? "USER",
  );

  if (existingPost)
    throw new AppError("Blog post with this name already exists", 400);

  const newPost = await blogQueries.createBlogPost(blogPostData);

  if (!newPost) throw new AppError("Failed to create blog post", 400);

  const keys = await redis.keys("blogs:all:*");
  if (keys.length) await redis.del(keys);

  return newPost;
};

export const updateBlogPost = async (
  blogId: string,
  user: Express.User | null,
  data: Prisma.BlogPostUpdateInput,
) => {
  const existingPost = await blogQueries.getBlogPost({
    id: blogId,
    ...(user?.role === "CONTRIBUTOR" ? { authorId: user.id } : {}),
  });

  if (!existingPost) throw new AppError("Blog post not found", 404);

  const { slug } = data;

  if (slug && typeof slug === "string") {
    const postWithSlug = await blogQueries.getBlogPost({ slug });
    if (postWithSlug && postWithSlug.id !== blogId)
      throw new AppError(
        `Bolg Post with title '${data.title}' already exists`,
        400,
      );
  }

  const updatedPost = await blogQueries.updateBlogPost(blogId, data);

  const keys = await redis.keys(`blogs:id:${blogId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("blogs:all:*");
  if (allKeys.length) await redis.del(allKeys);

  return updatedPost;
};

export const deleteBlogPost = async (blogId: string) => {
  const existingPost = await blogQueries.getBlogPost({ id: blogId });

  if (!existingPost) throw new AppError("Blog post not found", 404);

  const post = await blogQueries.deleteBlogPost(blogId);

  const keys = await redis.keys(`blogs:id:${blogId}:*`);
  if (keys.length) await redis.del(keys);

  const allKeys = await redis.keys("blogs:all:*");
  if (allKeys.length) await redis.del(allKeys);

  return post;
};
