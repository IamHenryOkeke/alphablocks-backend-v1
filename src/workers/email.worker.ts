import dotenv from "dotenv";
dotenv.config();

import { Job, Worker } from "bullmq";
import { redis } from "../lib/ioredis";
import { sendMail } from "../lib/nodemailer";

new Worker(
  "email-queue",
  async (job: Job) => {
    const { title, to, name, content } = job.data;

    await sendMail(title, (name || to) as string, to, content);
  },
  { connection: redis },
);
