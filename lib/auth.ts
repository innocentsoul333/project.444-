// lib/auth.ts
import { auth } from "@clerk/nextjs/server";

export function requireUserId() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export function getOptionalUserId() {
  const { userId } = auth();
  return userId ?? null;
}

export function requireAuthOrNull() {
  const { userId } = auth();
  return userId ?? null;
}
