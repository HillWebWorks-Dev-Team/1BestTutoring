"use client";

import { useActionState, useMemo, useState } from "react";
import { GRADE_LEVELS, SUBJECTS } from "@/lib/brand";
import { isLinkedInUrl, normalizeLinkedInUrl, parseProfileText, type ProfileAutofill } from "@/lib/profile-autofill";
import { UNIVERSITIES } from "@/lib/universities";
import { SubmitButton } from "@/components/ui";
import { applyAsTutor } from "@/server/apply";
import { parseLinkedInTextForAutofill, parseResumeForAutofill } from "@/server/autofill";

type Defaults = {
  name?: string;
  email?: string;
  university?: string;
  major?: string;
  degree?: string;
  graduationYear?: number;
  bio?: string;
  experience?: string;
  education?: string;
  achievements?: string;
  certifications?: string;
  testScores?: string;
  subjects?: string[];
  gradeLevels?: string[];
  hourlyRate?: number;
  linkedinUrl?: string;
};

function mergeDraft(current: Defaults, draft: ProfileAutofill): Defaults {
  return {
    ...current,
    name: draft.name || current.name,
    email: draft.email || current.email,
    university: draft.university || current.university,
    major: draft.major || current.major,
    degree: draft.degree || current.degree,
    graduationYear: draft.graduationYear || current.graduationYear,
    bio: draft.bio || current.bio,
    experience: draft.experience || current.experience,
    education: draft.education || current.education,
    achievements: draft.achievements || current.achievements,
    certifications: draft.certifications || current.certifications,
    testScores: draft.testScores || current.testScores,
    subjects: draft.subjects?.length ? draft.subjects : current.subjects,
    gradeLevels: draft.gradeLevels?.length ? draft.gradeLevels : current.gradeLevels,
    linkedinUrl: draft.linkedinUrl || current.linkedinUrl,
  };
}

export function ApplyForm({
  signedIn,
  defaults,
}: {
  signedIn: boolean;
  defaults?: Defaults;
}) {
  const [state, action] = useActionState(applyAsTutor, null);
  const [values, setValues] = useState<Defaults>(() => ({
    name: defaults?.name || "",
    email: defaults?.email || "",
    university: defaults?.university || UNIVERSITIES[0].name,
    major: defaults?.major || "",
    degree: defaults?.degree || "",
    graduationYear: defaults?.graduationYear || 2024,
    bio: defaults?.bio || "",
    experience: defaults?.experience || "",
    education: defaults?.education || "",
    achievements: defaults?.achievements || "",
    certifications: defaults?.certifications || "",
    testScores: defaults?.testScores || "",
    subjects: defaults?.subjects || [],
    gradeLevels: defaults?.gradeLevels || [],
    hourlyRate: defaults?.hourlyRate || 80,
    linkedinUrl: defaults?.linkedinUrl || "",
  }));
  const [linkedinPaste, setLinkedinPaste] = useState("");
  const [autofillNote, setAutofillNote] = useState<string | null>(null);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [autofilling, setAutofilling] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const universitySelect = useMemo(() => {
    if (UNIVERSITIES.some((school) => school.name === values.university)) return values.university || UNIVERSITIES[0].name;
    return "Other";
  }, [values.university]);
  const universityOther =
    universitySelect === "Other" && values.university && values.university !== "Other" ? values.university : "";

  function setField<K extends keyof Defaults>(key: K, value: Defaults[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: "subjects" | "gradeLevels", value: string) {
    setValues((current) => {
      const list = current[key] || [];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  }

  async function autofillFromLinkedIn() {
    setAutofillError(null);
    setAutofillNote(null);
    const url = values.linkedinUrl?.trim() || "";
    if (url && !isLinkedInUrl(url)) {
      setAutofillError("Use a LinkedIn profile link like https://www.linkedin.com/in/your-name.");
      return;
    }
    const source = linkedinPaste.trim() || url;
    if (!linkedinPaste.trim() && url) {
      setAutofillError("LinkedIn blocks automated reads. Paste your About, Experience, and Education text below, then click Autofill.");
      return;
    }
    setAutofilling(true);
    const result = await parseLinkedInTextForAutofill(source);
    setAutofilling(false);
    if (result.error || !result.draft) {
      setAutofillError(result.error || "Could not autofill from that text.");
      return;
    }
    const draft = {
      ...result.draft,
      linkedinUrl: normalizeLinkedInUrl(url) || result.draft.linkedinUrl,
    };
    setValues((current) => mergeDraft(current, draft));
    setAutofillNote("Filled what we could from your LinkedIn text. Review everything before submitting.");
  }

  async function onResumeSelected(file: File | null) {
    setResumeFile(file);
    setAutofillError(null);
    setAutofillNote(null);
    if (!file) return;

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text();
      const draft = parseProfileText(text);
      if (!Object.keys(draft).length) {
        setAutofillError("That text resume didn’t have enough recognizable details.");
        return;
      }
      setValues((current) => mergeDraft(current, draft));
      setAutofillNote("Filled from your resume. Review the fields, then finish anything we missed.");
      return;
    }

    setAutofilling(true);
    const body = new FormData();
    body.set("resume", file);
    const result = await parseResumeForAutofill(body);
    setAutofilling(false);
    if (result.error || !result.draft) {
      setAutofillError(result.error || "Could not autofill from that resume.");
      return;
    }
    setValues((current) => mergeDraft(current, result.draft!));
    setAutofillNote("Filled from your resume. Review the fields, then finish anything we missed.");
  }

  return (
    <form action={action} className="grid gap-8">
      {state?.error ? <p className="rounded-2xl bg-[#fbf1ef] px-4 py-3 text-sm text-[#7d332c]">{state.error}</p> : null}

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-paper p-5">
        <legend className="px-1 font-serif text-3xl">Quick fill</legend>
        <p className="text-sm leading-6 text-mute">
          Autocomplete from a LinkedIn profile paste, or upload a resume and we&apos;ll fill matching fields. You can still edit everything afterward.
        </p>
        <div>
          <label className="label" htmlFor="linkedinUrl">LinkedIn profile URL</label>
          <input
            id="linkedinUrl"
            className="field"
            name="linkedinUrl"
            value={values.linkedinUrl || ""}
            onChange={(event) => setField("linkedinUrl", event.target.value)}
            placeholder="https://www.linkedin.com/in/your-name"
          />
        </div>
        <div>
          <label className="label" htmlFor="linkedinPaste">Paste LinkedIn About / Experience / Education</label>
          <textarea
            id="linkedinPaste"
            className="field min-h-28"
            value={linkedinPaste}
            onChange={(event) => setLinkedinPaste(event.target.value)}
            placeholder="Copy the text from your LinkedIn profile sections and paste it here."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-line" type="button" disabled={autofilling} onClick={autofillFromLinkedIn}>
            {autofilling ? "Autofilling…" : "Autofill from LinkedIn"}
          </button>
        </div>
        <div>
          <label className="label" htmlFor="resume">Resume (autofills on upload)</label>
          <input
            id="resume"
            className="field"
            name="resume"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(event) => onResumeSelected(event.target.files?.[0] || null)}
          />
          {resumeFile ? <p className="mt-2 text-xs text-mute">Selected: {resumeFile.name}</p> : null}
        </div>
        {autofillNote ? <p className="rounded-xl bg-mist px-4 py-3 text-sm text-navy">{autofillNote}</p> : null}
        {autofillError ? <p className="rounded-xl bg-[#fbf1ef] px-4 py-3 text-sm text-[#7d332c]">{autofillError}</p> : null}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="font-serif text-3xl">Account</legend>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" className="field" name="name" value={values.name || ""} onChange={(event) => setField("name", event.target.value)} required />
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="field" name="email" type="email" value={values.email || ""} onChange={(event) => setField("email", event.target.value)} required />
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
        <select
          id="university"
          className="field md:col-span-2"
          name="university"
          value={universitySelect}
          onChange={(event) => {
            if (event.target.value === "Other") setField("university", universityOther || "Other");
            else setField("university", event.target.value);
          }}
        >
          {UNIVERSITIES.map((school) => (
            <option key={school.name} value={school.name}>
              {school.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
        <input
          className="field md:col-span-2"
          name="universityOther"
          placeholder="If other, write the school"
          value={universityOther}
          onChange={(event) => setField("university", event.target.value || "Other")}
        />
        <div>
          <label className="label" htmlFor="major">Major</label>
          <input id="major" className="field" name="major" value={values.major || ""} onChange={(event) => setField("major", event.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="degree">Degree</label>
          <input id="degree" className="field" name="degree" placeholder="BA, BS, AB…" value={values.degree || ""} onChange={(event) => setField("degree", event.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="graduationYear">Graduation year</label>
          <input
            id="graduationYear"
            className="field"
            name="graduationYear"
            type="number"
            value={values.graduationYear || 2024}
            onChange={(event) => setField("graduationYear", Number(event.target.value))}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="hourlyRate">Your hourly rate (USD)</label>
          <input
            id="hourlyRate"
            className="field"
            name="hourlyRate"
            type="number"
            min="25"
            step="1"
            value={values.hourlyRate || 80}
            onChange={(event) => setField("hourlyRate", Number(event.target.value))}
            required
          />
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="font-serif text-3xl">Subjects and grades</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <label key={subject} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="subjects" value={subject} checked={values.subjects?.includes(subject) || false} onChange={() => toggleList("subjects", subject)} />
              {subject}
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {GRADE_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2">
              <input type="checkbox" name="gradeLevels" value={level} checked={values.gradeLevels?.includes(level) || false} onChange={() => toggleList("gradeLevels", level)} />
              {level}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="font-serif text-3xl">Your practice</legend>
        <label className="label" htmlFor="bio">Biography</label>
        <textarea id="bio" className="field min-h-32" name="bio" value={values.bio || ""} onChange={(event) => setField("bio", event.target.value)} required />
        <label className="label" htmlFor="experience">Tutoring and work experience</label>
        <textarea id="experience" className="field min-h-28" name="experience" value={values.experience || ""} onChange={(event) => setField("experience", event.target.value)} required />
        <label className="label" htmlFor="education">Educational background</label>
        <textarea id="education" className="field min-h-20" name="education" value={values.education || ""} onChange={(event) => setField("education", event.target.value)} />
        <label className="label" htmlFor="achievements">Academic achievements</label>
        <textarea id="achievements" className="field min-h-20" name="achievements" value={values.achievements || ""} onChange={(event) => setField("achievements", event.target.value)} />
        <label className="label" htmlFor="certifications">Certifications</label>
        <textarea id="certifications" className="field min-h-16" name="certifications" value={values.certifications || ""} onChange={(event) => setField("certifications", event.target.value)} />
        <label className="label" htmlFor="testScores">Relevant test scores</label>
        <input id="testScores" className="field" name="testScores" value={values.testScores || ""} onChange={(event) => setField("testScores", event.target.value)} />
        <label className="label" htmlFor="introVideoUrl">Optional introduction video URL</label>
        <input id="introVideoUrl" className="field" name="introVideoUrl" placeholder="https://youtube.com/..." />
        <label className="label" htmlFor="availabilityNotes">When you can meet</label>
        <textarea id="availabilityNotes" className="field min-h-20" name="availabilityNotes" placeholder="Weekday evenings, Eastern Time…" />
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="font-serif text-3xl">More documents</legend>
        <p className="text-sm text-mute">PDF or image, up to 4MB. Proof of enrollment or graduation is required when we ask for it. Your resume above is already included with the application.</p>
        <label className="label" htmlFor="credentials">Academic credentials</label>
        <input id="credentials" className="field" name="credentials" type="file" accept=".pdf,image/*,.txt" />
        <label className="label" htmlFor="proof">Proof of enrollment or graduation</label>
        <input id="proof" className="field" name="proof" type="file" accept=".pdf,image/*,.txt" />
      </fieldset>
      <SubmitButton pendingLabel="Submitting…">Submit application</SubmitButton>
    </form>
  );
}
