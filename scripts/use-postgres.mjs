import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
const file = readFileSync(path, "utf8");
if (file.includes('provider = "postgresql"')) {
  console.log("Prisma is already set to postgresql.");
} else {
  writeFileSync(path, file.replace('provider = "sqlite"', 'provider = "postgresql"'));
  console.log("Switched Prisma to postgresql. Point DATABASE_URL / DIRECT_URL at Supabase, then run npx prisma db push.");
}
