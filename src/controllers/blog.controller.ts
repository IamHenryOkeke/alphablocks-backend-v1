import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as blogService from "../services/blog.services";
import { generateSlug } from "../utils/slug";

export const getAllBlogPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const data = await blogService.getAllBlogPosts(user, req.validatedQuery);

    res.status(200).json({
      message: "Blog posts fetched successfully",
      data,
    });
  },
);

export const getLatestBlogPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const data = await blogService.getLatestBlogPost(user);

    res.status(200).json({
      message: "Latest blog post fetched successfully",
      data,
    });
  },
);

export const getBlogPostById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const { blogId } = req.params;

    const data = await blogService.getBlogPostById(user, blogId);

    res.status(200).json({
      message: "Blog post fetched successfully",
      data,
    });
  },
);

export const createBlogPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { title, description, thumbnailImage, content } = req.body;
    const user = req.user as Express.User;

    const createBlogPostData = {
      title,
      slug: generateSlug(title),
      thumbnailImage,
      description,
      content,
      author: {
        connect: { id: user.id },
      },
    };

    const data = await blogService.createBlogPost(user, createBlogPostData);

    res.status(201).json({
      message: "Blog post created successfully",
      data,
    });
  },
);

export const updateBlogPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const { blogId } = req.params;
    const { title, description, thumbnailImage, content, isPublished } =
      req.body;

    const updateBlogPostData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(title && { slug: generateSlug(title) }),
      ...(thumbnailImage && { thumbnailImage }),
      ...(content && { content }),
      ...(isPublished && {
        isPublished: isPublished === "1" ? true : false,
        publishedAt: isPublished === "1" ? new Date() : null,
      }),
    };

    const data = await blogService.updateBlogPost(
      blogId,
      user,
      updateBlogPostData,
    );

    res.status(200).json({
      message: "Blog post updated successfully",
      data,
    });
  },
);

export const deleteBlogPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { blogId } = req.params;

    await blogService.deleteBlogPost(blogId);

    res.status(200).json({
      message: "Blog post deleted successfully",
    });
  },
);
