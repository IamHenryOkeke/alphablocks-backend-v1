import { Router } from "express";
import * as overviewControllers from "../controllers/overview.controllers";
import {
  isAuthenticated,
  roleAuthorization,
} from "../middlewares/auth.middleware";

const overviewRouter = Router();

overviewRouter.use(isAuthenticated, roleAuthorization(["ADMIN", "SUPERADMIN"]));

overviewRouter.get("/all", overviewControllers.getOverview);

export default overviewRouter;
