import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getEnv } from "../config/env";

const adapter = new PrismaPg({ connectionString: getEnv("DATABASE_URL") });
const prisma = new PrismaClient({ adapter });

export default prisma;
