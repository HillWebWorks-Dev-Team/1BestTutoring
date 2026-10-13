type MeetingInput = {
  topic: string;
  startsAt: Date;
  durationMin: number;
};

export type MeetingLink = {
  joinUrl: string | null;
  startUrl: string | null;
  meetingId: string | null;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function zoomToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    { method: "POST", headers: { Authorization: `Basic ${credentials}` } },
  );
  if (!response.ok) return null;
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function hostPath(token: string) {
  if (process.env.ZOOM_HOST_USER_ID) return `users/${encodeURIComponent(process.env.ZOOM_HOST_USER_ID)}`;
  // Server-to-Server apps can resolve the account owner via /users/me.
  const me = await fetch("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (me.ok) return "users/me";
  return null;
}

export async function createZoomMeeting(input: MeetingInput): Promise<MeetingLink> {
  const empty = { joinUrl: null, startUrl: null, meetingId: null };
  const token = await zoomToken();
  if (!token) return empty;

  const path = await hostPath(token);
  if (!path) return empty;

  const response = await fetch(`https://api.zoom.us/v2/${path}/meetings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.startsAt.toISOString(),
      duration: Math.max(1, input.durationMin),
      timezone: "UTC",
      settings: {
        waiting_room: true,
        join_before_host: false,
        approval_type: 0,
      },
    }),
  });

  if (!response.ok) return empty;
  const json = (await response.json()) as { id: number; join_url: string; start_url: string };
  return { joinUrl: json.join_url, startUrl: json.start_url, meetingId: String(json.id) };
}

export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
  return match?.[1] ?? null;
}
