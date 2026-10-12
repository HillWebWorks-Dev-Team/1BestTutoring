"use client";

import { useActionState } from "react";
import { GRADE_LEVELS, SUBJECTS } from "@/lib/brand";
import { SubmitButton } from "@/components/ui";
import { UNIVERSITIES } from "@/lib/universities";
import { applyAsTutor } from "@/server/apply";

export function ApplyForm({
  signedIn,
  defaults,
}: {
  signedIn: boolean;
  defaults?: {
    name?: string;
    email?: string;
    university?: string;
    major?: string;
    degree?: string;
    graduationYear?: number;
    bio?: string;
    experience?: string;
    subjects?: string[];
    gradeLevels?: string[];
    hourlyRate?: number;
  };
}) {
  const [state, action] = useActionState(applyAsTutor, null);
  const known = UNIVERSITIES.some((school) => school.name === defaults?.university);
  return (
    <form action={action} className="grid gap-8">
      {state?.error ? <p className="rounded-2xl bg-[#fbf1ef] px-4 py-3 text-sm text-[#7d332c]">{state.error}</p> : null}
      <fieldset className="grid gap-4">
        <legend className="font-serif text-3xl">Account</legend>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" className="field" name="name" defaultValue={defaults?.name} required />
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="field" name="email" type="email" defaultValue={defaults?.email} required />
        {signedIn ? null : (
          <>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" className="field" name="password" type="password" minLength={8} required />
          </>
        )}
      </fieldset>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="font-serif text-3xl md:col-span-2">Academics</legend>
        <label className="label md:col-span-2" htmlFor="university">University</label>
        <select id="university" className="field md:col-span-2" name="university" defaultValue={known ? defaults?.university : defaults?.university ? "Other" : UNIVERSITIES[0].name}>
          {UNIVERSITIES.map((school) => (
            <option key={school.name} value={school.name}>
              {school.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
        <input className="field md:col-span-2" name="universityOther" placeholder="If other, write the school" defaultValue={known ? "" : defaults?.university || ""} />
        <div>
          <label className="label" htmlFor="major">Major</label>
          <input id="major" className="field" name="major" defaultValue={defaults?.major} required />
        </div>
        <div>
          <label className="label" htmlFor="degree">Degree</label>
          <input id="degree" className="field" name="degree" placeholder="BA, BS, AB…" defaultValue={defaults?.degree} required />
        </div>
        <div>
          <label className="label" htmlFor="graduationYear">Graduation year</label>
          <input id="graduationYear" className="field" name="graduationYear" type="number" defaultValue={defaults?.graduationYear || 2024} required />
        </div>
        <div>
          <label className="label" htmlFor="hourlyRate">Your hourly rate (USD)</label>
          <input id="hourlyRate" className="field" name="hourlyRate" type="number" min="25" step="1" defaultValue={defaults?.hourlyRate || 80} required />
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="font-serif text-3xl">Subjects and grades</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <label key={subject} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="subjects" value={subject} defaultChecked={defaults?.subjects?.includes(subject)} />
              {subject}
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {GRADE_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2">
              <input type="checkbox" name="gradeLevels" value={level} defaultChecked={defaults?.gradeLevels?.includes(level)} />
              {level}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="font-serif text-3xl">Your practice</legend>
        <label className="label" htmlFor="bio">Biography</label>
        <textarea id="bio" className="field min-h-32" name="bio" defaultValue={defaults?.bio} required />
        <label className="label" htmlFor="experience">Tutoring and work experience</label>
        <textarea id="experience" className="field min-h-28" name="experience" defaultValue={defaults?.experience} required />
        <label className="label" htmlFor="education">Educational background</label>
        <textarea id="education" className="field min-h-20" name="education" />
        <label className="label" htmlFor="achievements">Academic achievements</label>
        <textarea id="achievements" className="field min-h-20" name="achievements" />
        <label className="label" htmlFor="certifications">Certifications</label>
        <textarea id="certifications" className="field min-h-16" name="certifications" />
        <label className="label" htmlFor="testScores">Relevant test scores</label>
        <input id="testScores" className="field" name="testScores" />
        <label className="label" htmlFor="introVideoUrl">Optional introduction video URL</label>
        <input id="introVideoUrl" className="field" name="introVideoUrl" placeholder="https://youtube.com/..." />
        <label className="label" htmlFor="availabilityNotes">When you can meet</label>
        <textarea id="availabilityNotes" className="field min-h-20" name="availabilityNotes" placeholder="Weekday evenings, Eastern Time…" />
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="font-serif text-3xl">Documents</legend>
        <p className="text-sm text-mute">PDF or image, up to 4MB. Proof of enrollment or graduation is required when we ask for it.</p>
        <label className="label" htmlFor="resume">Resume</label>
        <input id="resume" className="field" name="resume" type="file" accept=".pdf,image/*,.txt" />
        <label className="label" htmlFor="credentials">Academic credentials</label>
        <input id="credentials" className="field" name="credentials" type="file" accept=".pdf,image/*,.txt" />
        <label className="label" htmlFor="proof">Proof of enrollment or graduation</label>
        <input id="proof" className="field" name="proof" type="file" accept=".pdf,image/*,.txt" />
      </fieldset>
      <SubmitButton pendingLabel="Submitting…">Submit application</SubmitButton>
    </form>
  );
}
