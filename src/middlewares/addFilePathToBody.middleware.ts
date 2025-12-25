import { Request, Response, NextFunction } from "express";

export const addFilePathToBody =
  (key: string) => (req: Request, res: Response, next: NextFunction) => {
    if (req.file?.path) {
      req.body[key] = req.file.path;
    } else if (Array.isArray(req.files)) {
      // req.files is an array of files
      req.body[key] = req.files.map((file) => file.path);
    } else {
      delete req.body[key];
    }

    next();
  };
