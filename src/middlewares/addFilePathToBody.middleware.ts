import { Request, Response, NextFunction } from "express";

export const addFilePathToBody =
  (key: string) => (req: Request, res: Response, next: NextFunction) => {
    if (req.file?.path) {
      req.body[key] = req.file.path;
      return next();
    }

    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      const filesRecord = req.files as Record<string, Express.Multer.File[]>;

      if (filesRecord[key] && Array.isArray(filesRecord[key])) {
        const files = filesRecord[key];

        if (files.length === 1) {
          req.body[key] = files[0].path;
        } else if (files.length > 0) {
          req.body[key] = files.map((file) => file.path);
        } else {
          delete req.body[key];
        }
        return next();
      }
    }

    delete req.body[key];
    next();
  };
