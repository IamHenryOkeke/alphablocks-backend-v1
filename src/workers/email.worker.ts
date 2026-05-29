import dotenv from "dotenv";
dotenv.config();

import { Job, Worker } from "bullmq";
import { redis } from "../lib/ioredis";
import { sendMail } from "../lib/nodemailer";

new Worker(
  "email-queue",
  async (job: Job) => {
    const { subject, to, content } = job.data;

    await sendMail(subject, to, content);
  },
  { connection: redis.options },
);
