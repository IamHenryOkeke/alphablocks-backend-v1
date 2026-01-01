import { Request, Response, NextFunction } from "express";
import passport from "../config/passport-config";
import { AppError } from "../error/errorHandler";
import { Role } from "../generated/prisma/enums";

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

export const roleAuthorization = (role: Role | Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (Array.isArray(role)) {
      if (req.user && role.includes(req.user.role)) {
        return next();
      } else {
        throw new AppError(
          "You are not authorized to access this resource",
          403,
        );
      }
    }
    if (req.user && req.user.role === role) {
      return next();
    } else {
      throw new AppError("You are not authorized to access this resource", 403);
    }
  };
};
