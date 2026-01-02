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
import * as cohortController from "../controllers/cohort.controllers";

const cohortRouter = Router();

cohortRouter.get(
  "/all",
  optionalAuth,
  validate({ query: schemas.querySchema }),
  cohortController.getAllCohorts,
);

cohortRouter.get("/latest", optionalAuth, cohortController.getLatestCohort);

cohortRouter.get(
  "/:cohortId",
  optionalAuth,
  validate({ params: schemas.cohortParamSchema }),
  cohortController.getCohortById,
);

cohortRouter.use(isAuthenticated, roleAuthorization("ADMIN"));

cohortRouter.post(
  "/",
  upload.single("thumbnailImage"),
  addFilePathToBody("thumbnailImage"),
  validate({ body: schemas.createCohortSchema }),
  cohortController.createCohort,
);

cohortRouter.put(
  "/:cohortId",
  upload.single("thumbnailImage"),
  addFilePathToBody("thumbnailImage"),
  validate({
    params: schemas.cohortParamSchema,
    body: schemas.updateCohortSchema,
  }),
  cohortController.updateCohort,
);

cohortRouter.delete(
  "/:cohortId",
  validate({ params: schemas.cohortParamSchema }),
  cohortController.deleteCohort,
);

export default cohortRouter;
