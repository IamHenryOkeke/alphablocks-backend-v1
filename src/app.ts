import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";

import passport from "./config/passport-config";
import corsOptions from "./config/cors";

import { CustomError } from "./lib/type";
import * as routes from "./routes";

const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use("/api/auth", routes.authRouter);
app.use("/api/events", routes.eventRouter);
app.use("/api/blogs", routes.blogRouter);
app.use("/api/cohorts", routes.cohortRouter);
app.use("/api", routes.indexRouter);

app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "The route you are looking for does not exist.",
  });
});

app.use(
  (err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || "Something went wrong",
      details: err.details ?? undefined,
    });
  },
);

export default app;
