import { Router } from "express";
import {
  roleAuthorization,
  isAuthenticated,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation";
import * as schemas from "../lib/schemas";
import * as userControllers from "../controllers/user.controllers";

const userRouter = Router();

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
