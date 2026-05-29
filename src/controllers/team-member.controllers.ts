import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as teamMemberService from "../services/team-member.services";

export const getTeamMemberStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await teamMemberService.getTeamStats();

    res.status(200).json({
      message: "Team member stats fetched successfully",
      data: {
        stats: data,
      },
    });
  },
);

export const getAllTeamMembers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    const data = await teamMemberService.getAllTeamMembers(
      user,
      req.validatedQuery,
    );

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
    const data = await teamMemberService.createTeamMember(req.body);

    res.status(201).json({
      message: data.reinvited
        ? "Invite resent successfully"
        : "Team Member created successfully",
      data,
    });
  },
);

export const updateTeamMember = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { memberId } = req.params;

    const data = await teamMemberService.updateTeamMember(
      memberId as string,
      req.body,
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

    await teamMemberService.deleteTeamMember(memberId as string);

    res.status(200).json({
      message: "Team Member deleted successfully",
    });
  },
);
