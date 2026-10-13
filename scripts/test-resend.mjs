import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: process.env.EMAIL_FROM,
    to: ["delivered@resend.dev"],
    subject: "1% Better Tutoring — Resend test",
    text: "Resend is connected for 1% Better Tutoring.",
  }),
});

const body = await response.text();
console.log("status", response.status);
console.log(body.slice(0, 300));
