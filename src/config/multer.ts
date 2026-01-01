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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, _file) => ({
    folder: "AlphaBlocks",
    allowed_formats: ["jpg", "png", "jpeg"],
  }),
});

const fileFilter = (
  req: e.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  const fieldname = file.fieldname;

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new AppError("Invalid input", 400, {
        image: `${file.mimetype} not allowed`,
      }),
    );
  }
  if (file.size > 1 * 1024 * 1024) {
    return cb(
      new AppError("File too large", 400, {
        [`${fieldname}`]: "File size should be less than 1MB",
      }),
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter,
});
