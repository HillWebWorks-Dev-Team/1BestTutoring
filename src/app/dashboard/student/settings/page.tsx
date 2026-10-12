import { Notice } from "@/components/ui";
import { GRADE_LEVELS, SUBJECTS, TIMEZONES } from "@/lib/brand";
import { splitList } from "@/lib/brand";
import { requireUser } from "@/lib/session";
import { updateStudentSettings } from "@/server/learning";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const profile = user.studentProfile;
  const subjects = splitList(profile?.subjectsNeeded);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-5xl">Settings</h1>
      <div className="my-4"><Notice success={query.saved ? "Saved." : undefined} /></div>
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
        <fieldset>
          <legend className="label">Subjects you want</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUBJECTS.map((subject) => (
              <label key={subject} className="flex gap-2 text-sm">
                <input type="checkbox" name="subjects" value={subject} defaultChecked={subjects.includes(subject)} />
                {subject}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="label" htmlFor="guardianEmail">Guardian email</label>
        <input id="guardianEmail" className="field" name="guardianEmail" type="email" defaultValue={profile?.guardianEmail || ""} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isMinor" defaultChecked={profile?.isMinor} /> This account belongs to a minor
        </label>
        <p className="text-sm text-mute">Referral code: {profile?.referralCode}. Share /register?ref={profile?.referralCode}</p>
        <button className="btn btn-primary w-fit" type="submit">Save settings</button>
      </form>
    </div>
  );
}
