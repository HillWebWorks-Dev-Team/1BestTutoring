import { GoogleCalendarConnect } from "@/components/dashboard/GoogleCalendarConnect";
import { Notice } from "@/components/ui";
import { GRADE_LEVELS, SUBJECTS, TIMEZONES } from "@/lib/brand";
import { splitList } from "@/lib/brand";
import { money } from "@/lib/format";
import { googleConfigured } from "@/lib/google";
import { requireUser } from "@/lib/session";
import { updateStudentSettings } from "@/server/learning";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; calendar?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  const profile = user.studentProfile;
  const subjects = splitList(profile?.subjectsNeeded);
  const calendarNotice =
    query.calendar === "disconnected"
      ? "Google Calendar disconnected."
      : query.calendar === "connected"
        ? "Google Calendar connected."
        : undefined;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-5xl">Settings</h1>
      <div className="my-4">
        <Notice error={query.error} success={query.saved ? "Saved." : calendarNotice} />
      </div>
      <div className="grid gap-8">
        <GoogleCalendarConnect
          connected={Boolean(user.googleRefreshToken)}
          configured={googleConfigured()}
        />
        <form action={updateStudentSettings} className="grid gap-4">
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="field" name="name" defaultValue={user.name} />
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" className="field" name="phone" defaultValue={user.phone || ""} />
          <label className="label" htmlFor="timezone">Time zone</label>
          <select id="timezone" className="field" name="timezone" defaultValue={user.timezone}>
            {TIMEZONES.map((zone) => <option key={zone}>{zone}</option>)}
          </select>
          <label className="label" htmlFor="gradeLevel">Grade level</label>
          <select id="gradeLevel" className="field" name="gradeLevel" defaultValue={profile?.gradeLevel || "High School"}>
            {GRADE_LEVELS.map((level) => <option key={level}>{level}</option>)}
          </select>
          <label className="label" htmlFor="school">School</label>
          <input id="school" className="field" name="school" defaultValue={profile?.school || ""} />
          <label className="label" htmlFor="goals">Goals</label>
          <textarea id="goals" className="field min-h-24" name="goals" defaultValue={profile?.goals || ""} />
          <fieldset className="grid gap-3">
            <legend className="label">Subjects you want</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SUBJECTS.map((subject) => (
                <label key={subject} className="flex gap-2 text-sm">
                  <input type="checkbox" name="subjects" value={subject} defaultChecked={subjects.includes(subject)} />
                  {subject}
                </label>
              ))}
            </div>
            <label className="label" htmlFor="subjectsOther">Other subjects</label>
            <input
              id="subjectsOther"
              className="field"
              name="subjectsOther"
              defaultValue={subjects.filter((subject) => !(SUBJECTS as readonly string[]).includes(subject)).join(", ")}
              placeholder="Add any others, separated by commas"
            />
          </fieldset>
          <label className="label" htmlFor="guardianEmail">Guardian email</label>
          <input id="guardianEmail" className="field" name="guardianEmail" type="email" defaultValue={profile?.guardianEmail || ""} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isMinor" defaultChecked={profile?.isMinor} /> This account belongs to a minor
          </label>
          <button className="btn btn-primary w-fit" type="submit">Save settings</button>
        </form>
        <section className="card p-5">
          <p className="kicker">Referrals</p>
          <h2 className="mt-2 font-serif text-3xl">Invite friends</h2>
          <p className="mt-2 text-sm leading-6 text-mute">
            Share your code. When someone you invite books their first paid session, you both get tutoring credit
            (applied automatically at checkout, from the platform fee — tutors still earn their full share).
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <dt className="text-mute">Your code</dt>
              <dd className="font-semibold tracking-wide text-navy">{profile?.referralCode}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <dt className="text-mute">Credit balance</dt>
              <dd className="font-semibold text-navy">{money(profile?.creditBalanceCents || 0)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-mute">Share link</dt>
              <dd className="text-right font-medium text-navy break-all">
                /register?ref={profile?.referralCode}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
