import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
}

const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");
const tokenRes = await fetch(
  `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(process.env.ZOOM_ACCOUNT_ID)}`,
  { method: "POST", headers: { Authorization: `Basic ${credentials}` } },
);
const tokenJson = await tokenRes.json();
console.log("token", tokenRes.status, tokenJson.access_token ? "ok" : tokenJson);
if (!tokenJson.access_token) process.exit(1);

const headers = { Authorization: `Bearer ${tokenJson.access_token}`, "Content-Type": "application/json" };

for (const path of ["users/me", "users?status=active&page_size=5"]) {
  const res = await fetch(`https://api.zoom.us/v2/${path}`, { headers });
  console.log(path, res.status, (await res.text()).slice(0, 240));
}

const meetingRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
  method: "POST",
  headers,
  body: JSON.stringify({
    topic: "1% Better Tutoring test",
    type: 2,
    start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    duration: 15,
    timezone: "UTC",
  }),
});
console.log("users/me/meetings", meetingRes.status, (await meetingRes.text()).slice(0, 300));
