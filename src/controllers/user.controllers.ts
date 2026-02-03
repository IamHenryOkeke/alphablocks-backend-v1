import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as userService from "../services/user.services";

export const getAllUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await userService.getAllUsers(req.validatedQuery);

    res.status(200).json({
      message: "Users fetched successfully",
      data,
    });
  },
);

export const getUserById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    const data = await userService.getUserById(userId as string);

    res.status(200).json({
      message: "User fetched successfully",
      data,
    });
  },
);
