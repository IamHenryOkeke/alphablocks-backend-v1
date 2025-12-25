import { Router } from "express";
import {
  createUserSchema,
  loginUserSchema,
  resetPassswordSchema,
  sendVerificationLinkSchema,
  verifyAccountQuerySchema,
} from "../lib/schemas";
import passport from "passport";
import { signJWT } from "../utils/jwt";
import { validate } from "../middlewares/validation";
import * as authControllers from "../controllers/auth.controllers";
import { User } from "../generated/prisma/client";

const authRouter = Router();

authRouter.post(
  "/sign-up",
  validate({ body: createUserSchema }),
  authControllers.authSignUp,
);

authRouter.get(
  "/verify-account",
  validate({ query: verifyAccountQuerySchema }),
  authControllers.authVerifyEmail,
);
authRouter.post(
  "/request-verification-link",
  validate({ body: sendVerificationLinkSchema }),
  authControllers.authSendVerificationEmail,
);

authRouter.post(
  "/login",
  validate({ body: loginUserSchema }),
  authControllers.authLogin,
);
authRouter.post(
  "/request-password-reset",
  validate({ body: sendVerificationLinkSchema }),
  authControllers.authSendResetPasswordEmail,
);
authRouter.post(
  "/reset-password",
  validate({ body: resetPassswordSchema }),
  authControllers.authResetPassword,
);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user as User;

    const token = signJWT(user, 60 * 15);

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  },
);

export default authRouter;
