import { Router } from "express";
import {
  roleAuthorization,
  isAuthenticated,
} from "../middlewares/auth.middleware";
import { optionalAuth } from "../middlewares/optionalAuth.middleware";
import { validate } from "../middlewares/validation";
import * as schemas from "../lib/schemas";
import { upload } from "../config/multer";
import { addFilePathToBody } from "../middlewares/addFilePathToBody.middleware";
import * as eventControllers from "../controllers/event.controllers";

const eventRouter = Router();

eventRouter.use(optionalAuth);

eventRouter.get(
  "/all",
  validate({ query: schemas.querySchema }),
  eventControllers.getAllEvents,
);

eventRouter.get("/latest", optionalAuth, eventControllers.getLatestEvent);

eventRouter.get(
  "/:eventId",
  validate({ params: schemas.eventParamSchema }),
  eventControllers.getEventById,
);

eventRouter.use(isAuthenticated, roleAuthorization(["ADMIN", "SUPERADMIN"]));

eventRouter.post(
  "/",
  upload.fields([
    { name: "thumbnailImage" },
    { name: "eventImages", maxCount: 5 },
  ]),
  addFilePathToBody("thumbnailImage"),
  addFilePathToBody("eventImages"),
  validate({ body: schemas.createEventSchema }),
  eventControllers.createEvent,
);

eventRouter.put(
  "/:eventId",
  upload.fields([
    { name: "thumbnailImage" },
    { name: "eventImages", maxCount: 5 },
  ]),
  addFilePathToBody("thumbnailImage"),
  addFilePathToBody("eventImages"),
  validate({
    params: schemas.eventParamSchema,
    body: schemas.updateEventSchema,
  }),
  eventControllers.updateEvent,
);

eventRouter.delete(
  "/:eventId",
  validate({ params: schemas.eventParamSchema }),
  eventControllers.deleteEvent,
);

export default eventRouter;
