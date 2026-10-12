import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

async function canRead(id: string, userId: string, role: string) {
  if (role === "ADMIN") return true;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return false;
  if (doc.userId === userId) return true;
  const linked = await prisma.message.findFirst({
    where: {
      attachmentUrl: { contains: id },
      OR: [{ senderId: userId }, { recipientId: userId }],
    },
  });
  return Boolean(linked);
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return new Response("Sign in required", { status: 401 });
  if (!(await canRead(id, session.uid, session.role))) return new Response("Not found", { status: 404 });
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.fileName.replaceAll('"', "")}"`,
    },
  });
}
