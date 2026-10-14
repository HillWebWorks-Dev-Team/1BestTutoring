"use client";

import { useActionState, useMemo, useState } from "react";
import { GRADE_LEVELS, SUBJECTS } from "@/lib/brand";
import {
  ACHIEVEMENT_OPTIONS,
  CERTIFICATION_OPTIONS,
  DEGREES,
  EDUCATION_OPTIONS,
  EXPERIENCE_OPTIONS,
  GRADUATION_YEAR_OPTIONS,
  HOURLY_RATE_OPTIONS,
  MAJORS,
  TEST_SCORE_OPTIONS,
} from "@/lib/apply-options";
import { isLinkedInUrl, normalizeLinkedInUrl, parseProfileText, type ProfileAutofill } from "@/lib/profile-autofill";
import { UNIVERSITIES } from "@/lib/universities";
import { SelectWithOther } from "@/components/forms/SelectWithOther";
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

function choiceState(value: string | undefined, options: readonly string[]) {
  const current = value?.trim() || "";
  if (!current) return { select: options[0] || "Other", other: "" };
  if (options.includes(current)) return { select: current, other: "" };
  return { select: "Other", other: current };
}

export function ApplyForm({
  signedIn,
  defaults,
  requirePhoto = true,
}: {
  signedIn: boolean;
  defaults?: Defaults;
  requirePhoto?: boolean;
}) {
  const [state, action] = useActionState(applyAsTutor, null);
  const [values, setValues] = useState<Defaults>(() => ({
    name: defaults?.name || "",
    email: defaults?.email || "",
    university: defaults?.university || UNIVERSITIES[0].name,
    major: defaults?.major || MAJORS[0],
    degree: defaults?.degree || DEGREES[0],
    graduationYear: defaults?.graduationYear || new Date().getFullYear(),
    bio: defaults?.bio || "",
    experience: defaults?.experience || EXPERIENCE_OPTIONS[0],
    education: defaults?.education || EDUCATION_OPTIONS[0],
    achievements: defaults?.achievements || ACHIEVEMENT_OPTIONS[0],
    certifications: defaults?.certifications || CERTIFICATION_OPTIONS[0],
    testScores: defaults?.testScores || TEST_SCORE_OPTIONS[0],
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
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const universitySelect = useMemo(() => {
    if (UNIVERSITIES.some((school) => school.name === values.university)) return values.university || UNIVERSITIES[0].name;
    return "Other";
  }, [values.university]);
  const universityOther =
    universitySelect === "Other" && values.university && values.university !== "Other" ? values.university : "";

  const major = choiceState(values.major, MAJORS);
  const degree = choiceState(values.degree, DEGREES);
  const graduationYear = choiceState(String(values.graduationYear || ""), GRADUATION_YEAR_OPTIONS);
  const hourlyRate = choiceState(values.hourlyRate ? String(values.hourlyRate) : "", HOURLY_RATE_OPTIONS);
  const experience = choiceState(values.experience, EXPERIENCE_OPTIONS);
  const education = choiceState(values.education, EDUCATION_OPTIONS);
  const achievements = choiceState(values.achievements, ACHIEVEMENT_OPTIONS);
  const certifications = choiceState(values.certifications, CERTIFICATION_OPTIONS);
  const testScores = choiceState(values.testScores, TEST_SCORE_OPTIONS);

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

  function onPhotoSelected(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (!file) {
      setPhotoName(null);
      setPhotoPreview(null);
      return;
    }
    setPhotoName(file.name);
    setPhotoPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="grid gap-10" encType="multipart/form-data">
      {state?.error ? <p className="border border-[#e7c7c2] bg-[#fbf1ef] px-4 py-3 text-sm text-[#7d332c]">{state.error}</p> : null}

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">Quick fill</legend>
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
        {autofillNote ? <p className="border border-line bg-mist px-4 py-3 text-sm text-navy">{autofillNote}</p> : null}
        {autofillError ? <p className="border border-[#e7c7c2] bg-[#fbf1ef] px-4 py-3 text-sm text-[#7d332c]">{autofillError}</p> : null}
      </fieldset>

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">Account</legend>
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
        <div>
          <label className="label" htmlFor="photo">Profile photo</label>
          <p className="mb-2 text-sm text-mute">Required. A clear headshot tutors and families will see on your profile.</p>
          <input
            id="photo"
            className="field"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required={requirePhoto}
            onChange={(event) => onPhotoSelected(event.target.files?.[0] || null)}
          />
          {photoName ? <p className="mt-2 text-xs text-mute">Selected: {photoName}</p> : null}
          {photoPreview ? (
            <img src={photoPreview} alt="" className="mt-3 h-28 w-28 rounded-xl object-cover" />
          ) : null}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6 md:grid-cols-2">
        <legend className="px-1 font-serif text-3xl text-navy md:col-span-2">Academics</legend>
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
        {universitySelect === "Other" ? (
          <input
            className="field md:col-span-2"
            name="universityOther"
            placeholder="If other, write the school"
            value={universityOther}
            onChange={(event) => setField("university", event.target.value || "Other")}
            required
          />
        ) : (
          <input type="hidden" name="universityOther" value="" />
        )}

        <SelectWithOther
          id="major"
          label="Major"
          name="major"
          options={MAJORS}
          value={major.select}
          otherValue={major.other}
          onSelect={(value) => setField("major", value === "Other" ? major.other || "Other" : value)}
          onOther={(value) => setField("major", value || "Other")}
          required
        />
        <SelectWithOther
          id="degree"
          label="Degree"
          name="degree"
          options={DEGREES}
          value={degree.select}
          otherValue={degree.other}
          onSelect={(value) => setField("degree", value === "Other" ? degree.other || "Other" : value)}
          onOther={(value) => setField("degree", value || "Other")}
          required
        />
        <SelectWithOther
          id="graduationYear"
          label="Graduation year"
          name="graduationYear"
          options={GRADUATION_YEAR_OPTIONS}
          value={graduationYear.select}
          otherValue={graduationYear.other}
          onSelect={(value) =>
            setField("graduationYear", value === "Other" ? Number(graduationYear.other) || new Date().getFullYear() : Number(value))
          }
          onOther={(value) => setField("graduationYear", Number(value) || new Date().getFullYear())}
          otherInputType="number"
          otherPlaceholder="Enter graduation year"
          required
        />
        <SelectWithOther
          id="hourlyRate"
          label="Your hourly rate (USD)"
          name="hourlyRate"
          options={HOURLY_RATE_OPTIONS}
          value={hourlyRate.select}
          otherValue={hourlyRate.other}
          onSelect={(value) =>
            setField("hourlyRate", value === "Other" ? Number(hourlyRate.other) || 80 : Number(value))
          }
          onOther={(value) => setField("hourlyRate", Number(value) || 0)}
          otherInputType="number"
          otherPlaceholder="Enter your hourly rate"
          formatOption={(option) => (option === "Other" ? "Other" : `$${option}/hr`)}
          required
        />
      </fieldset>

      <fieldset className="grid gap-3 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">Subjects and grades</legend>
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

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">Your practice</legend>
        <label className="label" htmlFor="bio">Biography</label>
        <textarea id="bio" className="field min-h-32" name="bio" value={values.bio || ""} onChange={(event) => setField("bio", event.target.value)} required />

        <SelectWithOther
          id="experience"
          label="Tutoring and work experience"
          name="experience"
          options={EXPERIENCE_OPTIONS}
          value={experience.select}
          otherValue={experience.other}
          onSelect={(value) => setField("experience", value === "Other" ? experience.other || "Other" : value)}
          onOther={(value) => setField("experience", value || "Other")}
          otherPlaceholder="Describe your tutoring or teaching experience"
          required
        />
        <SelectWithOther
          id="education"
          label="Educational background"
          name="education"
          options={EDUCATION_OPTIONS}
          value={education.select}
          otherValue={education.other}
          onSelect={(value) => setField("education", value === "Other" ? education.other || "Other" : value)}
          onOther={(value) => setField("education", value || "Other")}
          otherPlaceholder="Describe your educational background"
          required
        />
        <SelectWithOther
          id="achievements"
          label="Academic achievements"
          name="achievements"
          options={ACHIEVEMENT_OPTIONS}
          value={achievements.select}
          otherValue={achievements.other}
          onSelect={(value) =>
            setField(
              "achievements",
              value === "Other" || value === "None of these / prefer to describe"
                ? achievements.other || value
                : value,
            )
          }
          onOther={(value) => setField("achievements", value || "Other")}
          otherPlaceholder="Describe your achievements"
        />
        <SelectWithOther
          id="certifications"
          label="Certifications"
          name="certifications"
          options={CERTIFICATION_OPTIONS}
          value={certifications.select}
          otherValue={certifications.other}
          onSelect={(value) => setField("certifications", value === "Other" ? certifications.other || "Other" : value)}
          onOther={(value) => setField("certifications", value || "Other")}
          otherPlaceholder="List your certifications"
        />
        <SelectWithOther
          id="testScores"
          label="Relevant test scores"
          name="testScores"
          options={TEST_SCORE_OPTIONS}
          value={testScores.select}
          otherValue={testScores.other}
          onSelect={(value) => setField("testScores", value === "Other" ? testScores.other || "Other" : value)}
          onOther={(value) => setField("testScores", value || "Other")}
          otherPlaceholder="Share the scores you want listed"
        />

        <label className="label" htmlFor="introVideoUrl">Optional introduction video URL</label>
        <input id="introVideoUrl" className="field" name="introVideoUrl" placeholder="https://youtube.com/..." />
        <label className="label" htmlFor="availabilityNotes">When you can meet</label>
        <textarea id="availabilityNotes" className="field min-h-20" name="availabilityNotes" placeholder="Weekday evenings, Eastern Time…" />
      </fieldset>

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">More documents</legend>
        <p className="text-sm text-mute">PDF or image, up to 4MB. Proof of enrollment or graduation is required when we ask for it. Your resume above is already included with the application.</p>
        <label className="label" htmlFor="credentials">Academic credentials</label>
        <input id="credentials" className="field" name="credentials" type="file" accept=".pdf,image/*,.txt" />
        <label className="label" htmlFor="proof">Proof of enrollment or graduation</label>
        <input id="proof" className="field" name="proof" type="file" accept=".pdf,image/*,.txt" />
      </fieldset>
      <div className="border border-line bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-6">
        <p className="text-sm leading-6 text-mute">
          Submitting sends your application to our review queue. You can sign in later to check status.
        </p>
        <SubmitButton pendingLabel="Submitting…" className="btn btn-primary mt-4 w-full sm:mt-0 sm:w-auto">
          Submit application
        </SubmitButton>
      </div>
    </form>
  );
}
