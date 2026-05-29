import { Router } from "express";
import {
  roleAuthorization,
  isAuthenticated,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation";
import * as schemas from "../lib/schemas";
import * as userControllers from "../controllers/user.controllers";
import { rateLimiter } from "../middlewares/rate-limiter.middleware";

const userRouter = Router();

userRouter.post(
  "/get-started",
  rateLimiter(5),
  validate({
    body: schemas.getStartedSchema,
  }),
  userControllers.getStarted,
);

userRouter.use(isAuthenticated, roleAuthorization(["ADMIN", "SUPERADMIN"]));

userRouter.get(
  "/all",
  validate({ query: schemas.querySchema }),
  userControllers.getAllUsers,
);

userRouter.get(
  "/:userId",
  validate({ params: schemas.userParamSchema }),
  userControllers.getUserById,
);

export default userRouter;
