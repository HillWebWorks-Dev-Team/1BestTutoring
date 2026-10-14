import { PrismaClient } from "@prisma/client";

/** Bump when Prisma models change so hot reload drops a stale client. */
const PRISMA_SCHEMA_VERSION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: number;
};

function databaseUrl() {
  const raw = process.env.DATABASE_URL || "";
  if (!raw || raw.includes("connect_timeout=")) return raw || undefined;
  const join = raw.includes("?") ? "&" : "?";
  return `${raw}${join}connect_timeout=8&pool_timeout=8`;
}

function createPrisma() {
  const url = databaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

function getPrisma() {
  if (globalForPrisma.prisma && globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION) {
    return globalForPrisma.prisma;
  }
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  }
  const client = createPrisma();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  return client;
}

export const prisma = getPrisma();
