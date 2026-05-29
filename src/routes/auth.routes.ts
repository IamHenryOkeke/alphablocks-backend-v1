import { Router } from "express";
import * as schemas from "../lib/schemas";
import { validate } from "../middlewares/validation";
import * as authControllers from "../controllers/auth.controllers";
import { rateLimiter } from "../middlewares/rate-limiter.middleware";
import passport from "passport";
import { signJWT } from "../utils/jwt";
import { User } from "../generated/prisma/client";

const authRouter = Router();

authRouter.get(
  "/verify-account",
  validate({ query: schemas.verifyAccountQuerySchema }),
  authControllers.verifyEmail,
);
authRouter.post(
  "/request-verification-link",
  validate({ body: schemas.sendVerificationLinkSchema }),
  authControllers.sendVerificationEmail,
);

authRouter.post(
  "/accept-admin-invite",
  rateLimiter(5),
  validate({
    body: schemas.acceptInviteSchema,
  }),
  authControllers.acceptInvite,
);

authRouter.post(
  "/login",
  rateLimiter(5),
  validate({ body: schemas.loginUserSchema }),
  authControllers.login,
);
authRouter.post(
  "/request-password-reset",
  rateLimiter(5),
  validate({ body: schemas.sendVerificationLinkSchema }),
  authControllers.sendResetPasswordEmail,
);
authRouter.post(
  "/reset-password",
  validate({ body: schemas.resetPassswordSchema }),
  authControllers.resetPassword,
);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
// /api/auth/google
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
