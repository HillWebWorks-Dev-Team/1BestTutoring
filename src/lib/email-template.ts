import { appUrl, BRAND } from "@/lib/brand";

const COLORS = {
  navy: "#0b2038",
  deep: "#08192c",
  ivory: "#f6f3ed",
  gold: "#d5a344",
  mute: "#667587",
  line: "#e5e8ec",
  paper: "#ffffff",
  ink: "#14263c",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphHtml(body: string) {
  return escapeHtml(body)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:${COLORS.ink};">${line}</p>`,
    )
    .join("");
}

export function renderBrandedEmail(input: {
  title: string;
  body: string;
  href?: string;
  ctaLabel?: string;
}) {
  const base = appUrl();
  // Email clients can't load images from localhost — prefer a public host for assets in local/dev.
  const assetBase =
    process.env.EMAIL_ASSET_BASE_URL?.replace(/\/$/, "") ||
    (base.includes("localhost") || base.includes("127.0.0.1")
      ? "https://www.onepercentbettertutoring.com"
      : base);
  const logoUrl = `${assetBase}/logo.png`;
  const actionUrl = input.href ? `${base}${input.href.startsWith("/") ? input.href : `/${input.href}`}` : "";
  const cta = input.ctaLabel || "Open dashboard";
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.ivory};color:${COLORS.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(input.body)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.ivory};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.paper};border:1px solid ${COLORS.line};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${COLORS.deep};padding:22px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${logoUrl}" width="40" height="40" alt="${escapeHtml(BRAND.name)}" style="display:block;border-radius:10px;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.1;color:${COLORS.ivory};">1% Better</div>
                    <div style="margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(246,243,237,0.72);">Tutoring</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:${COLORS.gold};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.gold};font-weight:700;">${escapeHtml(BRAND.short)}</p>
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:${COLORS.navy};font-weight:400;">${escapeHtml(input.title)}</h1>
              ${paragraphHtml(input.body)}
              ${
                actionUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                <tr>
                  <td style="border-radius:10px;background:${COLORS.gold};">
                    <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${COLORS.deep};text-decoration:none;">${escapeHtml(cta)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:${COLORS.mute};">Or paste this link into your browser:</p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.55;word-break:break-all;"><a href="${actionUrl}" style="color:${COLORS.navy};">${escapeHtml(actionUrl)}</a></p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid ${COLORS.line};font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${COLORS.mute};">${escapeHtml(BRAND.tagline)}</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${COLORS.mute};">© ${year} ${escapeHtml(BRAND.name)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    input.title,
    "",
    input.body,
    actionUrl ? `\n${cta}: ${actionUrl}` : "",
    "",
    `${BRAND.name} — ${BRAND.tagline}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

/** Pick a sensible button label from common notification hrefs. */
export function emailCtaLabel(href?: string) {
  if (!href) return "Open dashboard";
  if (href.includes("/application")) return "View application";
  if (href.includes("/bookings")) return "View booking";
  if (href.includes("/calendar")) return "Open calendar";
  if (href.includes("/billing") || href.includes("/payments")) return "View billing";
  if (href.includes("/messages")) return "Open messages";
  if (href.includes("/settings")) return "Open settings";
  if (href.includes("/admin")) return "Open admin";
  return "Open dashboard";
}
