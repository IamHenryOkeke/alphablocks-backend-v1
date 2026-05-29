import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(3, { error: "Name must be at least 3 characters long" }),
  email: z.email({ error: "Email must be valid" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      error: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      error: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { error: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      error: "Password must contain at least one special character",
    }),
});

export const getStartedSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, { message: "Name must be at least 2 characters" }),

  email: z
    .email({ error: "Please enter a valid email address" })
    .trim()
    .toLowerCase(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    error: "Gender must be either 'MALE','FEMALE','OTHER'",
  }),

  country: z
    .string({ error: "Country is required" })
    .trim()
    .min(2, { message: "Country must be at least 2 characters" }),

  state: z
    .string({ error: "State is required" })
    .trim()
    .min(2, { message: "State must be at least 2 characters" }),

  phoneNumber: z
    .string({ error: "Phone number is required" })
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, {
      message: "Please enter a valid phone number (e.g., +2348012345678)",
    }),

  careerPath: z
    .string({ error: "Career path is required" })
    .trim()
    .min(2, { message: "Career path must be at least 2 characters" }),

  levelOfExperience: z
    .string({ error: "Level of experience is required" })
    .trim()
    .min(2, { message: "Level of experience must be at least 2 characters" }),

  referralMode: z
    .string({ error: "Referral mode is required" })
    .trim()
    .min(2, { message: "Referral mode must be at least 2 characters" }),
  isSubscribed: z.enum(["YES", "NO"], {
    error: "Must be either 'YES' or 'NO'",
  }),
});

export const loginUserSchema = z.object({
  email: z.email({ error: "Email must be valid" }),
  password: z.string({ error: "Password is required" }).min(6),
});

export const sendVerificationLinkSchema = loginUserSchema.pick({
  email: true,
});

export const verifyAccountQuerySchema = z.object({
  token: z
    .string()
    .min(3, { error: "Token must be at least 3 characters long" }),
});

export const resetPassswordSchema = createUserSchema
  .omit({ name: true, email: true })
  .extend({
    token: z
      .string()
      .min(3, { error: "Token must be at least 3 characters long" }),
  });

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(3, { error: "Name must be at least 3 characters long" })
    .optional(),
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters long" })
    .optional(),
  image: z.url({ error: "Avatar must be a valid url" }).optional(),
});

export const querySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, { error: "Page must be a positive integer" })
    .transform(Number)
    .default(1)
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/, { error: "Limit must be a positive integer" })
    .transform(Number)
    .default(6)
    .optional(),

  searchTerm: z.string().trim().toLowerCase().optional(),
  type: z.string().trim().toLowerCase().optional(),
  publication: z.enum(["published", "draft", "all"]).default("all").optional(),
  dateFilter: z
    .enum(["all", "upcoming", "ongoing", "ended"])
    .default("all")
    .optional(),
});

export const eventParamSchema = z.object({
  eventId: z.cuid({ error: "Invalid event ID" }),
});

const createEventBaseSchema = z.object({
  title: z
    .string()
    .min(5, { error: "Title must be at least 5 characters long" }),
  thumbnailImage: z.url({ error: "Must be a valid url" }),
  eventImages: z
    .array(z.url({ error: "Each event image must be a valid url" }))
    .optional(),
  description: z
    .string()
    .min(10, { error: "Description must be at least 10 characters long" }),
  details: z
    .string()
    .min(20, { error: "Content must be at least 20 characters long" }),
  startDate: z.iso
    .datetime({ error: "Start date must be a valid ISO-8601 datetime" })
    .refine((date) => new Date(date) > new Date(), {
      error: "Start date must be in the future",
    }),
  location: z
    .string()
    .min(5, { error: "Location must be at least 5 characters long" }),
  endDate: z.iso.datetime({
    error: "End date must be a valid ISO-8601 datetime",
  }),
});

export const createEventSchema = createEventBaseSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    error: "End date must be after start date",
    path: ["endDate"],
  },
);

export const updateEventSchema = createEventBaseSchema.partial().extend({
  isPublished: z
    .enum(["0", "1"], 'Only inputs of "0" and "1" are allowed')
    .optional(),
});

export const blogParamSchema = z.object({
  blogId: z.cuid({ error: "Invalid blog ID" }),
});

export const createBlogSchema = z.object({
  title: z
    .string()
    .min(5, { error: "Title must be at least 5 characters long" }),
  description: z
    .string()
    .min(10, { error: "Description must be at least 10 characters long" }),
  thumbnailImage: z.url({ error: "Must be a valid url" }),
  content: z
    .string()
    .min(20, { error: "Content must be at least 20 characters long" }),
});

export const updateBlogSchema = createBlogSchema.partial().extend({
  isPublished: z
    .enum(["0", "1"], 'Only inputs of "0" and "1" are allowed')
    .optional(),
});

export const cohortParamSchema = z.object({
  cohortId: z.cuid({ error: "Invalid cohort ID" }),
});

const createCohortBaseSchema = createEventBaseSchema
  .omit({
    eventImages: true,
    location: true,
  })
  .extend({
    classTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please enter a valid time"),
    whatsappGroupUrl: z.url({ error: "Must be a valid url" }),
    venue: z
      .string()
      .min(5, { error: "Venue must be at least 5 characters long" }),
  });

export const createCohortSchema = createCohortBaseSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    error: "End date must be after start date",
    path: ["endDate"],
  },
);

export const updateCohortNftSchema = z.object({
  nftCertificateUrl: z.url({ error: "Must be a valid url" }),
});

export const updateCohortSchema = createCohortBaseSchema
  .omit({ startDate: true })
  .partial()
  .extend({
    isPublished: z
      .enum(["0", "1"], 'Only inputs of "0" and "1" are allowed')
      .optional(),
    nftLiveStatus: z
      .enum(["0", "1"], 'Only inputs of "0" and "1" are allowed')
      .optional(),
    startDate: z.iso
      .datetime({ error: "Start date must be a valid ISO-8601 datetime" })
      .optional(),
  });

export const registerCohortSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long")
    .trim(),
  email: z.email("Invalid email address").toLowerCase().trim(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    error: "Gender must be either 'MALE','FEMALE','OTHER'",
  }),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number")
    .trim(),
});

export const userParamSchema = z.object({
  userId: z.cuid({ error: "Invalid user ID" }),
});

export const teamMemberParamSchema = z.object({
  memberId: z.cuid({ error: "Invalid team member ID" }),
});

export const createTeamMemberSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .min(5, { error: "Title must be at least 5 characters long" }),
  twitterUrl: z.url({ error: "Must be a valid url" }).optional(),
  linkedInUrl: z.url({ error: "Must be a valid url" }).optional(),
  image: z.url({ error: "Must be a valid url" }),
  email: z.email({ error: "Email is required" }),
  category: z.enum(
    [
      "FOUNDER",
      "DESIGN_AND_PRODUCT",
      "COMMUNITY_MANAGEMENT",
      "ENGINEERING",
      "CONTENT_CREATION",
      "OTHERS",
    ],
    {
      error: "Invalid category",
    },
  ),
});

export const updateTeamMemberSchema = createTeamMemberSchema
  .omit({
    email: true,
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
    path: ["updateData"],
  });

export const acceptInviteSchema = z.object({
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      error: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      error: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { error: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      error: "Password must contain at least one special character",
    }),
  token: z.string({ error: "Token is required" }),
});
