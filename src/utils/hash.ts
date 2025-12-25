import * as argon2 from "argon2";

export async function hashPassword(password: string) {
  const result = await argon2.hash(password);
  return result;
}

export async function comparePassword(
  hashedPassword: string,
  password: string,
) {
  const result = await argon2.verify(hashedPassword, password);
  return result;
}
