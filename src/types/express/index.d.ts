import { Role } from "../../generated/prisma/enums";
import { JwtPayload } from "../auth";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
      email: string;
      role: Role;
    }
  }
}

declare module "express" {
  export interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validatedQuery?: any; // you can replace `any` with a custom Zod-inferred type
  }
}
