import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
const file = readFileSync(path, "utf8");
if (file.includes('provider = "postgresql"')) {
  console.log("Prisma is already set to postgresql.");
} else {
  writeFileSync(path, file.replace('provider = "sqlite"', 'provider = "postgresql"'));
  console.log("Switched Prisma to postgresql. Point DATABASE_URL at Neon or Vercel Postgres, then run npx prisma db push.");
}
