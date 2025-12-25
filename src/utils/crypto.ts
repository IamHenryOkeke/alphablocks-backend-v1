import crypto from "crypto";

export const createToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
