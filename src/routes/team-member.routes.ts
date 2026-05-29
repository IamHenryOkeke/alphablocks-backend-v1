import { Router } from "express";
import {
  roleAuthorization,
  isAuthenticated,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation";
import * as schemas from "../lib/schemas";
import * as teamMemberControllers from "../controllers/team-member.controllers";
import { upload } from "../config/multer";
import { addFilePathToBody } from "../middlewares/addFilePathToBody.middleware";
import { optionalAuth } from "../middlewares/optionalAuth.middleware";

const teamMemberRouter = Router();

teamMemberRouter.use(optionalAuth);

teamMemberRouter.get(
  "/all",
  validate({ query: schemas.querySchema }),
  teamMemberControllers.getAllTeamMembers,
);

teamMemberRouter.use(
  isAuthenticated,
  roleAuthorization(["ADMIN", "SUPERADMIN"]),
);

teamMemberRouter.get(
  "/:memberId",
  validate({ params: schemas.teamMemberParamSchema }),
  teamMemberControllers.getTeamMemberById,
);

teamMemberRouter.use(roleAuthorization("SUPERADMIN"));

teamMemberRouter.get("/admin/stats", teamMemberControllers.getTeamMemberStats);

teamMemberRouter.post(
  "/",
  upload.single("image"),
  addFilePathToBody("image"),
  validate({ body: schemas.createTeamMemberSchema }),
  teamMemberControllers.createTeamMember,
);

teamMemberRouter.put(
  "/:memberId",
  upload.single("image"),
  addFilePathToBody("image"),
  validate({
    params: schemas.teamMemberParamSchema,
    body: schemas.updateTeamMemberSchema,
  }),
  teamMemberControllers.updateTeamMember,
);

teamMemberRouter.delete(
  "/:memberId",
  validate({ params: schemas.teamMemberParamSchema }),
  teamMemberControllers.deleteTeamMember,
);

export default teamMemberRouter;
