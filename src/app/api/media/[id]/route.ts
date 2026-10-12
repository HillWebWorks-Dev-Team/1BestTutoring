import { prisma } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.kind !== "PROFILE_PHOTO") return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(doc.data), {
    headers: { "Content-Type": doc.mimeType, "Cache-Control": "public, max-age=86400" },
  });
}
