import { Request, Response, NextFunction } from "express";
import passport from "../config/passport-config";
import { AppError } from "../error/errorHandler";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    function (err: unknown, user: Express.User, _info: unknown) {
      if (err) return next(err);
      if (!user)
        return next(new AppError("JWT expired. Please login again", 401));

      req.user = user;
      return next();
    },
  )(req, res, next);
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "ADMIN") {
    return next();
  } else {
    throw new AppError("You are not authorized to access this resource", 403);
  }
};
