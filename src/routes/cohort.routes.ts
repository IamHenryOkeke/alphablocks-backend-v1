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

cohortRouter.use(optionalAuth);

cohortRouter.get(
  "/all",
  validate({ query: schemas.querySchema }),
  cohortController.getAllCohorts,
);

cohortRouter.get("/latest", optionalAuth, cohortController.getLatestCohort);

cohortRouter.get(
  "/:cohortId",
  validate({ params: schemas.cohortParamSchema }),
  cohortController.getCohortById,
);

cohortRouter.post(
  "/:cohortId/register",
  validate({
    params: schemas.cohortParamSchema,
    body: schemas.registerCohortSchema,
  }),
  cohortController.registerCohort,
);

cohortRouter.use(isAuthenticated, roleAuthorization(["ADMIN", "SUPERADMIN"]));

cohortRouter.get("/admin/stats", cohortController.getCohortStats);

cohortRouter.get(
  "/:cohortId/participants",
  validate({ params: schemas.cohortParamSchema, query: schemas.querySchema }),
  cohortController.getCohortParticipants,
);

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

cohortRouter.put(
  "/:cohortId/nft-certificate",
  upload.single("nftCertificateUrl"),
  addFilePathToBody("nftCertificateUrl"),
  validate({
    params: schemas.cohortParamSchema,
    body: schemas.updateCohortNftSchema,
  }),
  cohortController.updateCohortCertificate,
);

cohortRouter.delete(
  "/:cohortId",
  validate({ params: schemas.cohortParamSchema }),
  cohortController.deleteCohort,
);

export default cohortRouter;
