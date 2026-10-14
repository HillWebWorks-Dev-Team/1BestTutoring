import { disconnectGoogleCalendar } from "@/server/calendar";

export function GoogleCalendarConnect({
  connected,
  configured,
}: {
  connected: boolean;
  configured: boolean;
}) {
  return (
    <section className="rounded-2xl border border-line bg-mist/40 px-5 py-5">
      <p className="kicker">Calendar sync</p>
      <h2 className="mt-1 font-serif text-3xl text-navy">Google Calendar</h2>
      <p className="mt-2 text-sm leading-6 text-mute">
        When connected, new sessions are added to your primary Google Calendar automatically. You can still
        download an .ics file from any booking.
      </p>

      {connected ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-navy">Status: connected</p>
          <form action={disconnectGoogleCalendar}>
            <button className="btn btn-line" type="submit">
              Disconnect
            </button>
          </form>
        </div>
      ) : configured ? (
        <a className="btn btn-primary mt-4 inline-flex w-fit" href="/api/calendar/google/start">
          Connect Google Calendar
        </a>
      ) : (
        <p className="mt-4 rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-mute">
          Google OAuth keys are not configured for this environment yet. Use .ics downloads from booking
          pages until <code className="text-navy">GOOGLE_CLIENT_ID</code> and{" "}
          <code className="text-navy">GOOGLE_CLIENT_SECRET</code> are set.
        </p>
      )}
    </section>
  );
}
