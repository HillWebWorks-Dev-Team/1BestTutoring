import { appUrl } from "./brand";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${appUrl()}/api/calendar/google/callback`,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar.events",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function accessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { access_token: string };
  return json.access_token;
}

export async function pushGoogleEvent(options: {
  refreshToken: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
}) {
  const token = await accessToken(options.refreshToken);
  if (!token) return false;
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: options.title,
      description: options.description,
      start: { dateTime: options.startsAt.toISOString(), timeZone: "UTC" },
      end: { dateTime: options.endsAt.toISOString(), timeZone: "UTC" },
    }),
  });
  return response.ok;
}
