import nodemailer from "nodemailer";
import { AppError } from "../error/errorHandler";
import { getEnv } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: getEnv("SMTP_USER"),
    pass: getEnv("SMTP_PASS"),
  },
});

export const sendMail = async (
  subject: string,
  to: string,
  message: string,
) => {
  try {
    await transporter.sendMail({
      from: getEnv("SMTP_USER"),
      to,
      subject,
      html: message,
    });
  } catch (error) {
    console.log(error);
    throw new AppError("Could not send verification email", 500);
  }
};
