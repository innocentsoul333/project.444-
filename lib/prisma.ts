// lib/prisma.ts
type PrismaClientLike = {
  [key: string]: unknown;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientLike;
};

function createUnavailablePrismaClient(): PrismaClientLike {
  const message =
    "Prisma client is unavailable. Fix prisma/schema.prisma and run prisma generate.";

  // Return callable stubs for any accessed model/method to avoid build-time crashes.
  return new Proxy(
    {},
    {
      get() {
        return new Proxy(() => undefined, {
          apply() {
            throw new Error(message);
          },
          get() {
            return () => {
              throw new Error(message);
            };
          },
        });
      },
    }
  ) as PrismaClientLike;
}

function createPrismaClient(): PrismaClientLike {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client");
    return new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  } catch {
    return createUnavailablePrismaClient();
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
