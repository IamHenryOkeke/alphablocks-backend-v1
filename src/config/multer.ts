import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import e from "express";
import { AppError } from "../error/errorHandler";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage (files will be saved in 'uploads' folder)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, _file) => ({
    folder: "cloudinary-folder",
    allowed_formats: ["jpg", "png", "jpeg"],
  }),
});

// File filter function (allows only specific file types)
const fileFilter = (
  req: e.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new AppError("Invalid input", 400, {
        image: `${file.mimetype} not allowed`,
      }),
    );
  }
  if (file.size > 2 * 1024 * 1024) {
    return cb(
      new AppError("File too large", 400, {
        avatar: "File size should be less than 2MB",
      }),
    );
  }
  cb(null, true);
};

// Multer middleware configuration
export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});
