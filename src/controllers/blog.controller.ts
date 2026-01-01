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

    const post = await blogService.getBlogPostById(user, blogId);

    res.status(200).json({
      message: "Blog post fetched successfully",
      post,
    });
  },
);

export const createBlogPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { title, description, thumbnailImage, content } = req.body;
    const user = req.user as Express.User;

    const data = {
      title,
      slug: generateSlug(title),
      thumbnailImage,
      description,
      content,
      author: {
        connect: { id: user.id },
      },
    };

    const newPost = await blogService.createBlogPost(user, data);

    res.status(201).json({
      message: "Blog post created successfully",
      event: newPost,
    });
  },
);

export const updateBlogPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const { blogId } = req.params;
    const { title, description, thumbnailImage, content, isPublished } =
      req.body;

    const data = {
      ...(title && { title }),
      ...(description && { description }),
      slug: generateSlug(title),
      ...(thumbnailImage && { thumbnailImage }),
      ...(content && { content }),
      ...(isPublished !== undefined && { isPublished }),
    };

    const updatedPost = await blogService.updateBlogPost(blogId, user, data);

    res.status(200).json({
      message: "Blog post updated successfully",
      product: updatedPost,
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
