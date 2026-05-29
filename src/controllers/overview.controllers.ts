import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as overviewService from "../services/overview.services";

type Range = "7d" | "30d" | "90d" | "all";

const VALID_RANGES: Range[] = ["7d", "30d", "90d", "all"];

function parseRange(value: unknown): Range {
  if (typeof value === "string" && (VALID_RANGES as string[]).includes(value)) {
    return value as Range;
  }
  return "30d";
}

export const getOverview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { range } = req.query;

    const formattedRange = parseRange(range);
    const result = await overviewService.getOverview(formattedRange);

    res.status(200).json({
      message: "Overview data retrieved successfully",
      data: result,
    });
  },
);
