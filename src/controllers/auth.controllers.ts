import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as authService from "../services/auth.services";

export const authSignUp = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    const user = await authService.signUp({ email, password, name });

    res.status(201).json({
      message:
        "Registration successful. Please check your email for a verification link",
      user,
    });
  },
);

export const authLogin = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const { user, token } = await authService.logIn(email, password);

    res.status(201).json({
      message: "Login successful",
      user,
      token,
    });
  },
);

export const authSendVerificationEmail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const result = await authService.sendVerificationEmail(email as string);

    res.status(200).json(result);
  },
);

export const authVerifyEmail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    const result = await authService.verifyEmail(token as string);

    res.status(200).json(result);
  },
);

export const authSendResetPasswordEmail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const result = await authService.sendResetPasswordEmail(email);

    res.status(200).json(result);
  },
);

export const authResetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await authService.resetPassword(req.body);

    res.status(200).json(result);
  },
);
