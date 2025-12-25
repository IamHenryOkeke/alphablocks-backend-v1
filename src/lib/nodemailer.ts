import nodemailer from "nodemailer";
import { AppError } from "../error/errorHandler";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export const sendMail = async (
  subject: string,
  name: string,
  to: string,
  message: string,
) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html: message,
    });
  } catch (error) {
    console.log(error);
    throw new AppError("Could not send verification email", 500);
  }
};
