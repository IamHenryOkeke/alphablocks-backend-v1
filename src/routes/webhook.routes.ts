import express, { Router } from "express";
import * as cohortControllers from "../controllers/cohort.controllers";

const webhookRouter = Router();

webhookRouter.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  cohortControllers.paystackWebhook,
);

export default webhookRouter;
