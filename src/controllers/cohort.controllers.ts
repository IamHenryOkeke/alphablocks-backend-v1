import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as cohortService from "../services/cohort.services";
import { generateSlug } from "../utils/slug";

export const getCohortStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await cohortService.getCohortStats();

    res.status(200).json({
      message: "Cohort stats fetched successfully",
      data: {
        stats: data,
      },
    });
  },
);

export const getAllCohorts = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const data = await cohortService.getAllCohorts(user, req.validatedQuery);

    res.status(200).json({
      message: "Cohorts fetched successfully",
      data,
    });
  },
);

export const getLatestCohort = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const data = await cohortService.getLatestCohort(user);

    res.status(200).json({
      message: "Latest cohort fetched successfully",
      data,
    });
  },
);

export const getCohortById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const { cohortId } = req.params;

    const data = await cohortService.getCohortById(user, cohortId as string);

    res.status(200).json({
      message: "Cohort fetched successfully",
      data,
    });
  },
);

export const getCohortParticipants = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const { cohortId } = req.params;

    const data = await cohortService.getCohortParticipants(
      user,
      cohortId as string,
    );

    res.status(200).json({
      message: "Participants fetched successfully",
      data: {
        participants: data,
      },
    });
  },
);

export const registerCohort = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const data = await cohortService.registerCohort(
      cohortId as string,
      req.body,
    );

    res.status(200).json({
      message: "Cohort registered successfully",
      data,
    });
  },
);

export const createCohort = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      title,
      thumbnailImage,
      description,
      details,
      startDate,
      endDate,
      venue,
      classTime,
      whatsappGroupUrl,
    } = req.body;

    const user = req.user as Express.User;

    const createCohortData = {
      title,
      slug: generateSlug(title),
      thumbnailImage,
      description,
      details,
      startDate,
      endDate,
      venue,
      classTime,
      whatsappGroupUrl,
      creator: {
        connect: { id: user.id },
      },
    };

    const data = await cohortService.createCohort(createCohortData);

    res.status(201).json({
      message: "Cohort created successfully",
      data,
    });
  },
);

export const updateCohort = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const {
      title,
      thumbnailImage,
      description,
      details,
      startDate,
      endDate,
      venue,
      classTime,
      isPublished,
      nftLiveStatus,
    } = req.body;

    const updateCohortData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(title && { slug: generateSlug(title) }),
      ...(thumbnailImage && { thumbnailImage }),
      ...(details && { details }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(venue && { venue }),
      ...(classTime && { classTime }),
      ...(nftLiveStatus && {
        nftLiveStatus: nftLiveStatus === "1" ? true : false,
      }),
      ...(isPublished && {
        isPublished: isPublished === "1" ? true : false,
        publishedAt: isPublished === "1" ? new Date() : null,
      }),
    };

    const data = await cohortService.updateCohort(
      cohortId as string,
      updateCohortData,
    );

    res.status(200).json({
      message: "Cohort updated successfully",
      data,
    });
  },
);

export const updateCohortCertificate = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { nftCertificateUrl } = req.body;

    const data = await cohortService.updateCohort(cohortId as string, {
      nftCertificateUrl,
    });

    res.status(200).json({
      message: "Cohort nft updated successfully",
      data,
    });
  },
);

export const deleteCohort = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;

    await cohortService.deleteCohort(cohortId as string);

    res.status(200).json({
      message: "Cohort deleted successfully",
    });
  },
);

export const paystackWebhook = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers["x-paystack-signature"] as string;
    const rawBody = req.body as Buffer;

    const result = await cohortService.webhook(rawBody, signature);
    const { statusCode, message } = result || {
      statusCode: 500,
      message: "Webhook processing failed",
    };

    res.status(statusCode).json({
      message,
    });
  },
);
