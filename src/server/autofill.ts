"use server";

import { parseProfileText, type ProfileAutofill } from "@/lib/profile-autofill";

async function textFromPdf(buffer: Buffer) {
  // Import the lib entry directly. The package root runs a debug harness when
  // `module.parent` is unset (common with Next/dynamic import) and throws ENOENT.
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = ("default" in mod ? mod.default : mod) as (data: Buffer) => Promise<{ text: string }>;
  const parsed = await pdfParse(buffer);
  return parsed.text || "";
}

export async function parseResumeForAutofill(formData: FormData): Promise<{ draft?: ProfileAutofill; error?: string }> {
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a resume file first." };
  if (file.size > 4 * 1024 * 1024) return { error: "Keep the resume under 4MB." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      text = buffer.toString("utf8");
    } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      text = await textFromPdf(buffer);
    } else {
      return { error: "Upload a PDF or .txt resume to autofill." };
    }

    const draft = parseProfileText(text);
    if (!Object.keys(draft).length) {
      return { error: "We couldn’t read enough text from that file. Paste LinkedIn details instead, or fill the form manually." };
    }
    return { draft };
  } catch {
    return { error: "That resume could not be read. Try a PDF or .txt export." };
  }
}

export async function parseLinkedInTextForAutofill(raw: string): Promise<{ draft?: ProfileAutofill; error?: string }> {
  const text = String(raw || "").trim();
  if (text.length < 40) {
    return { error: "Paste a longer LinkedIn About / Experience / Education section to autofill." };
  }
  const draft = parseProfileText(text);
  if (!Object.keys(draft).length) {
    return { error: "We couldn’t map that LinkedIn text. Add a bit more Education or Experience and try again." };
  }
  return { draft };
}
