import { Router } from "express";
import * as schemas from "../lib/schemas";
import * as blogController from "../controllers/blog.controller";
import { validate } from "../middlewares/validation";
import { optionalAuth } from "../middlewares/optionalAuth.middleware";
import {
  isAuthenticated,
  roleAuthorization,
} from "../middlewares/auth.middleware";
import { upload } from "../config/multer";
import { addFilePathToBody } from "../middlewares/addFilePathToBody.middleware";

const blogRouter = Router();

blogRouter.get(
  "/all",
  optionalAuth,
  validate({ query: schemas.querySchema }),
  blogController.getAllBlogPost,
);
blogRouter.get("/latest", optionalAuth, blogController.getLatestBlogPost);

blogRouter.get(
  "/:blogId",
  optionalAuth,
  validate({ params: schemas.blogParamSchema }),
  blogController.getBlogPostById,
);

blogRouter.use(
  isAuthenticated,
  roleAuthorization(["CONTRIBUTOR", "ADMIN", "SUPERADMIN"]),
);

blogRouter.post(
  "/",
  upload.single("thumbnailImage"),
  addFilePathToBody("thumbnailImage"),
  validate({ body: schemas.createBlogSchema }),
  blogController.createBlogPost,
);

blogRouter.put(
  "/:blogId",
  upload.single("thumbnailImage"),
  addFilePathToBody("thumbnailImage"),
  validate({
    body: schemas.updateBlogSchema,
    params: schemas.blogParamSchema,
  }),
  blogController.updateBlogPost,
);

blogRouter.use(roleAuthorization(["ADMIN", "SUPERADMIN"]));

blogRouter.delete(
  "/:blogId",
  validate({ params: schemas.blogParamSchema }),
  blogController.deleteBlogPost,
);

export default blogRouter;
