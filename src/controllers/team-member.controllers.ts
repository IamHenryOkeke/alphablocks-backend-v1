import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as teamMemberService from "../services/team-member.services";

export const getAllTeamMembers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await teamMemberService.getAllTeamMembers(req.validatedQuery);

    res.status(200).json({
      message: "Team Members fetched successfully",
      data,
    });
  },
);

export const getTeamMemberById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { memberId } = req.params;

    const data = await teamMemberService.getTeamMemberById(memberId as string);

    res.status(200).json({
      message: "Team Member fetched successfully",
      data,
    });
  },
);

export const createTeamMember = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { title, twitterUrl, linkedInUrl, image, userId, category } =
      req.body;

    const createTeamMemberData = {
      title,
      ...(twitterUrl && { twitterUrl }),
      ...(linkedInUrl && { linkedInUrl }),
      category,
      user: {
        connect: {
          id: userId,
        },
        ...(image && {
          update: {
            image,
          },
        }),
      },
    };

    const data = await teamMemberService.createTeamMember(createTeamMemberData);

    res.status(201).json({
      message: "Team Member created successfully",
      data,
    });
  },
);

export const updateTeamMember = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { memberId } = req.params;
    const { title, twitterUrl, linkedInUrl, image, userId, category } =
      req.body;

    const updateTeamMemberData = {
      ...(title && { title }),
      ...(twitterUrl && { twitterUrl }),
      ...(linkedInUrl && { linkedInUrl }),
      ...(category && { category }),
      user: {
        ...(userId && {
          connect: {
            id: userId,
          },
        }),
        ...(image && {
          update: {
            image,
          },
        }),
      },
    };

    const data = await teamMemberService.updateTeamMember(
      memberId as string,
      updateTeamMemberData,
    );

    res.status(200).json({
      message: "Team Member updated successfully",
      data,
    });
  },
);

export const deleteTeamMember = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { memberId } = req.params;

    const data = await teamMemberService.deleteUser(memberId as string);

    res.status(200).json({
      message: "Team Member deleted successfully",
      data,
    });
  },
);
