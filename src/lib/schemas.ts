import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(3, { message: "Name must be at least 3 characters long" }),
  email: z.email({ message: "Email must be valid" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

export const loginUserSchema = z.object({
  email: z.string({ message: "Email is required" }),
  password: z.string({ message: "Password is required" }).min(6),
});

export const sendVerificationLinkSchema = loginUserSchema.pick({
  email: true,
});

export const verifyAccountQuerySchema = z.object({
  token: z
    .string()
    .min(3, { message: "Token must be at least 3 characters long" }),
});

export const resetPassswordSchema = createUserSchema
  .omit({ name: true, email: true })
  .extend({
    token: z
      .string()
      .min(3, { message: "Token must be at least 3 characters long" }),
  });

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .optional(),
  image: z.url({ message: "Avatar must be a valid url" }).optional(),
});

export const querySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, { message: "Page must be a positive integer" })
    .transform(Number)
    .default(1)
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/, { message: "Limit must be a positive integer" })
    .transform(Number)
    .default(6)
    .optional(),

  searchTerm: z.string().optional(),
});

export const eventParamSchema = z.object({
  eventId: z.cuid(),
});

export const addEventSchema = z
  .object({
    title: z
      .string()
      .min(5, { message: "Title must be at least 5 characters long" }),
    image: z.url({ message: "Must be a valid url" }),
    eventImages: z
      .array(z.url({ message: "Each event image must be a valid url" }))
      .optional(),
    description: z
      .string()
      .min(10, { message: "Description must be at least 10 characters long" }),
    details: z
      .string()
      .min(20, { message: "Content must be at least 20 characters long" }),
    startDate: z.iso
      .datetime({ message: "Start date must be a valid ISO-8601 datetime" })
      .refine((date) => new Date(date) > new Date(), {
        message: "Start date must be in the future",
      }),
    location: z
      .string()
      .min(5, { message: "Location must be at least 5 characters long" }),
    endDate: z.iso.datetime({
      message: "End date must be a valid ISO-8601 datetime",
    }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateEventSchema = addEventSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

export const blogParamSchema = z.object({
  blogId: z.cuid(),
});

export const createBlogSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters long" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" }),
  thumbnailImage: z.url({ message: "Must be a valid url" }),
  content: z
    .string()
    .min(20, { message: "Content must be at least 20 characters long" }),
});

export const updateBlogSchema = createBlogSchema.partial().extend({
  isPublished: z.boolean().optional(),
});
