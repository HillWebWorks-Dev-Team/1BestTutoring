import { prisma } from "./db";
import { appUrl } from "./brand";

type NotifyInput = {
  userId: string;
  email?: string | null;
  type: string;
  title: string;
  body: string;
  href?: string;
  dedupeKey?: string;
};

export async function notify(input: NotifyInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        dedupeKey: input.dedupeKey,
      },
    });
  } catch {
    // Duplicate reminder keys are expected and should not fail the caller.
  }

  if (!input.email || !process.env.RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "1% Better Tutoring <hello@onepercentbetter.com>",
      to: [input.email],
      subject: input.title,
      text: `${input.body}${input.href ? `\n\n${appUrl()}${input.href}` : ""}`,
    }),
  }).catch(() => undefined);
}

export async function notifyAdmins(input: Omit<NotifyInput, "userId" | "email">) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        ...input,
        userId: admin.id,
        email: admin.email,
        dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${admin.id}` : undefined,
      }),
    ),
  );
}
