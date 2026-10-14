import { Notice } from "@/components/ui";
import { GRADE_LEVELS, SUBJECTS } from "@/lib/brand";
import { splitList } from "@/lib/brand";
import { platformSettings } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { UNIVERSITIES } from "@/lib/universities";
import { updateTutorProfile } from "@/server/tutor";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TutorProfileEdit({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const profile = user.tutorProfile;
  if (!profile || profile.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const settings = await platformSettings();
  const subjects = splitList(profile.subjects);
  const grades = splitList(profile.gradeLevels);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-5xl">Profile</h1>
      <p className="mt-3 text-sm leading-6 text-mute">Biography, rate, and photo update immediately. University, degree, subjects, and credentials wait for admin approval before they change on the public profile. Current rate limits: ${settings.minHourlyRateCents / 100}–${settings.maxHourlyRateCents / 100}.</p>
      {profile.pendingChanges ? <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm">Qualification edits are waiting for review. Your current public profile is unchanged.</p> : null}
      <div className="my-4"><Notice error={query.error} success={query.saved ? "Saved." : undefined} /></div>
      <form action={updateTutorProfile} className="grid gap-4">
        <label className="label">Hourly rate (USD)</label>
        <input className="field" name="hourlyRate" type="number" defaultValue={profile.hourlyRateCents / 100} />
        <label className="label">Biography</label>
        <textarea className="field min-h-28" name="bio" defaultValue={profile.bio} />
        <label className="label">Experience</label>
        <textarea className="field min-h-24" name="experience" defaultValue={profile.experience} />
        <label className="label">Education</label>
        <textarea className="field min-h-20" name="education" defaultValue={profile.education} />
        <label className="label">Availability notes</label>
        <textarea className="field min-h-16" name="availabilityNotes" defaultValue={profile.availabilityNotes} />
        <label className="label">Intro video URL</label>
        <input className="field" name="introVideoUrl" defaultValue={profile.introVideoUrl || ""} />
        <label className="label">Profile photo</label>
        <input className="field" type="file" name="photo" accept="image/*" />
        <p className="text-xs uppercase tracking-wider text-gold">Changes below need approval</p>
        <label className="label">University</label>
        <select className="field" name="university" defaultValue={profile.university}>
          {UNIVERSITIES.map((school) => <option key={school.name} value={school.name}>{school.name}</option>)}
          <option value={profile.university}>{profile.university}</option>
        </select>
        <label className="label">Major</label>
        <input className="field" name="major" defaultValue={profile.major} />
        <label className="label">Degree</label>
        <input className="field" name="degree" defaultValue={profile.degree} />
        <label className="label">Graduation year</label>
        <input className="field" name="graduationYear" type="number" defaultValue={profile.graduationYear} />
        <label className="label">Achievements</label>
        <textarea className="field" name="achievements" defaultValue={profile.achievements} />
        <label className="label">Certifications</label>
        <textarea className="field" name="certifications" defaultValue={profile.certifications} />
        <label className="label">Test scores</label>
        <input className="field" name="testScores" defaultValue={profile.testScores} />
        <p className="label">Subjects</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((subject) => (
            <label key={subject} className="text-sm"><input type="checkbox" name="subjects" value={subject} defaultChecked={subjects.includes(subject)} /> {subject}</label>
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
        <p className="label">Grade levels</p>
        <div className="flex flex-wrap gap-3 text-sm">
          {GRADE_LEVELS.map((level) => (
            <label key={level}><input type="checkbox" name="gradeLevels" value={level} defaultChecked={grades.includes(level)} /> {level}</label>
          ))}
        </div>
        <label className="label" htmlFor="gradeLevelsOther">Other grade levels</label>
        <input
          id="gradeLevelsOther"
          className="field"
          name="gradeLevelsOther"
          defaultValue={grades.filter((level) => !(GRADE_LEVELS as readonly string[]).includes(level)).join(", ")}
          placeholder="Add any others, separated by commas"
        />
        <button className="btn btn-primary w-fit" type="submit">Save profile</button>
      </form>
    </div>
  );
}
