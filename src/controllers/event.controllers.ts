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

    const event = await eventService.getEventById(user, eventId);

    res.status(200).json({
      message: "Event fetched successfully",
      event,
    });
  },
);

export const createEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      title,
      image,
      eventImages,
      description,
      details,
      startDate,
      endDate,
      location,
    } = req.body;
    const user = req.user as Express.User;

    const data = {
      title,
      slug: generateSlug(title),
      image,
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

    const newEvent = await eventService.createEvent(data);

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  },
);

export const updateEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { eventId } = req.params;
    const {
      title,
      image,
      description,
      details,
      startDate,
      endDate,
      location,
      isPublished,
    } = req.body;

    const data = {
      ...(title && { title }),
      ...(description && { description }),
      slug: generateSlug(title),
      ...(image && { image }),
      ...(details && { details }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(location && { location }),
      ...(isPublished !== undefined && { isPublished }),
    };

    const updatedEvent = await eventService.updateEvent(eventId, data);

    res.status(200).json({
      message: "Event updated successfully",
      product: updatedEvent,
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
