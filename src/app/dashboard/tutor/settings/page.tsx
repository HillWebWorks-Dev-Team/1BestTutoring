import { GoogleCalendarConnect } from "@/components/dashboard/GoogleCalendarConnect";
import { Notice } from "@/components/ui";
import { TIMEZONES } from "@/lib/brand";
import { googleConfigured } from "@/lib/google";
import { requireRole } from "@/lib/session";
import { updateTutorAccountSettings } from "@/server/tutor";

export const dynamic = "force-dynamic";

export default async function TutorSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; calendar?: string }>;
}) {
  const query = await searchParams;
  const user = await requireRole(["TUTOR"]);
  const calendarNotice =
    query.calendar === "disconnected"
      ? "Google Calendar disconnected."
      : query.calendar === "connected"
        ? "Google Calendar connected."
        : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-5xl">Settings</h1>
      <p className="mt-3 text-sm leading-6 text-mute">
        Account basics and calendar sync. Public profile details live under Profile.
      </p>
      <div className="my-4">
        <Notice
          error={query.error}
          success={query.saved ? "Saved." : calendarNotice}
        />
      </div>

      <div className="grid gap-8">
        <GoogleCalendarConnect
          connected={Boolean(user.googleRefreshToken)}
          configured={googleConfigured()}
        />

        <form action={updateTutorAccountSettings} className="grid gap-4">
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" className="field" name="name" defaultValue={user.name} />
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input id="phone" className="field" name="phone" defaultValue={user.phone || ""} />
          <label className="label" htmlFor="timezone">
            Time zone
          </label>
          <select id="timezone" className="field" name="timezone" defaultValue={user.timezone}>
            {TIMEZONES.map((zone) => (
              <option key={zone}>{zone}</option>
            ))}
          </select>
          <button className="btn btn-primary w-fit" type="submit">
            Save settings
          </button>
        </form>
      </div>
    </div>
  );
}
