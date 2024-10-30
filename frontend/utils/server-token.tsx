// utils/auth.ts
import { auth } from "@clerk/nextjs/server";

export async function getAuthToken() {
  const { getToken } = await auth();
  const token = await getToken({ template: "backend" });
  return token;
}
