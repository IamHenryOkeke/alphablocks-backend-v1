import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as eventService from "../services/event.services";
import { generateSlug } from "../utils/slug";

export const getAllEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const data = await eventService.getAllEvents(user, req.validatedQuery);

    res.status(200).json({
      message: "Events fetched successfully",
      data,
    });
  },
);

export const getLatestEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const data = await eventService.getLatestEvent(user);

    res.status(200).json({
      message: "Events fetched successfully",
      data,
    });
  },
);

export const getEventById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Express.User;
    const { eventId } = req.params;

    const data = await eventService.getEventById(user, eventId);

    res.status(200).json({
      message: "Event fetched successfully",
      data,
    });
  },
);

export const createEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      title,
      thumbnailImage,
      eventImages,
      description,
      details,
      startDate,
      endDate,
      location,
    } = req.body;
    const user = req.user as Express.User;

    const createEventData = {
      title,
      slug: generateSlug(title),
      thumbnailImage,
      ...(eventImages && {
        eventImages: {
          create: eventImages.map((imgUrl: string) => ({ imageUrl: imgUrl })),
        },
      }),
      description,
      details,
      startDate,
      endDate,
      location,
      creator: {
        connect: { id: user.id },
      },
    };

    const data = await eventService.createEvent(createEventData);

    res.status(201).json({
      message: "Event created successfully",
      data,
    });
  },
);

export const updateEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { eventId } = req.params;
    const {
      title,
      thumbnailImage,
      description,
      details,
      startDate,
      endDate,
      location,
      isPublished,
    } = req.body;

    const updateEventData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(title && { slug: generateSlug(title) }),
      ...(thumbnailImage && { thumbnailImage }),
      ...(details && { details }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(location && { location }),
      ...(isPublished && {
        isPublished: isPublished === "1" ? true : false,
        publishedAt: isPublished === "1" ? new Date() : null,
      }),
    };

    const data = await eventService.updateEvent(eventId, updateEventData);

    res.status(200).json({
      message: "Event updated successfully",
      data,
    });
  },
);

export const deleteEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { eventId } = req.params;

    await eventService.deleteEvent(eventId);

    res.status(200).json({
      message: "Event deleted successfully",
    });
  },
);
