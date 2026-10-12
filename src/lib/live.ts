import { connection } from "next/server";
import { prisma } from "./db";

export async function live() {
  await connection();
  return prisma;
}

export async function platformSettings() {
  const db = await live();
  return (
    (await db.platformSettings.findUnique({ where: { id: "default" } })) ??
    (await db.platformSettings.create({ data: { id: "default" } }))
  );
}
