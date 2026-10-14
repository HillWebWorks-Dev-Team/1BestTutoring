"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
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
import { Spinner } from "@/components/ui/PageLoader";
import { toast } from "@/components/ui/Toast";
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
    subjects: draft.subjects?.length
      ? draft.subjects.filter((subject) => (SUBJECTS as readonly string[]).includes(subject))
      : current.subjects,
    gradeLevels: draft.gradeLevels?.length
      ? draft.gradeLevels.filter((level) => (GRADE_LEVELS as readonly string[]).includes(level))
      : current.gradeLevels,
    linkedinUrl: draft.linkedinUrl || current.linkedinUrl,
  };
}

function choiceState(value: string | undefined, options: readonly string[]) {
  const current = value?.trim() || "";
  if (!current) return { select: options[0] || "Other", other: "" };
  if (options.includes(current)) return { select: current, other: "" };
  return { select: "Other", other: current };
}

const BIO_MIN = 40;

const APPLY_STEPS = [
  "Saving your account details…",
  "Uploading profile and documents…",
  "Sending application to review…",
];

function RequiredMark() {
  return (
    <span className="text-[#b42318]" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function ApplySubmitFooter() {
  const { pending } = useFormStatus();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!pending) {
      setStep(0);
      return;
    }
    setStep(0);
    const timers = [
      window.setTimeout(() => setStep(1), 1000),
      window.setTimeout(() => setStep(2), 2200),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [pending]);

  const progress = pending ? Math.min(92, 18 + step * 28) : 0;

  return (
    <>
      <div className="flex flex-col gap-4 border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <p className="min-w-0 text-sm leading-6 text-mute">
          Submitting sends your application to our review queue. You can sign in later to check status.
        </p>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="btn btn-primary w-full shrink-0 whitespace-nowrap sm:w-auto"
        >
          Submit application
        </button>
      </div>

      {pending ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="apply-loading-title"
          aria-busy="true"
        >
          <div className="w-full max-w-md border border-line bg-white p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-mist">
                <Spinner className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="kicker">Application</p>
                <h2 id="apply-loading-title" className="mt-1 font-serif text-3xl text-navy">
                  Submitting your application
                </h2>
                <p className="mt-2 text-sm leading-6 text-mute">
                  Hang tight - we’re saving your details and sending them to the review queue. Don’t close this tab.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-mute">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ol className="mt-6 space-y-3">
              {APPLY_STEPS.map((item, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <li
                    key={item}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                      active
                        ? "border-gold/50 bg-gold/10 text-navy"
                        : done
                          ? "border-line bg-mist text-navy"
                          : "border-transparent text-mute"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                        done ? "bg-navy text-ivory" : active ? "bg-gold text-deep" : "bg-line text-mute"
                      }`}
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <span className={active ? "font-medium" : ""}>{item}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
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
  const [autofilling, setAutofilling] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const allowSubmitRef = useRef(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [subjectsOther, setSubjectsOther] = useState(() =>
    (defaults?.subjects || []).filter((subject) => !(SUBJECTS as readonly string[]).includes(subject)).join(", "),
  );
  const [gradeLevelsOther, setGradeLevelsOther] = useState(() =>
    (defaults?.gradeLevels || []).filter((level) => !(GRADE_LEVELS as readonly string[]).includes(level)).join(", "),
  );

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
  const bioLength = (values.bio || "").trim().length;
  const bioReady = bioLength >= BIO_MIN;

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

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
    const url = values.linkedinUrl?.trim() || "";
    if (url && !isLinkedInUrl(url)) {
      toast.error("Use a LinkedIn profile link like https://www.linkedin.com/in/your-name.");
      return;
    }
    const source = linkedinPaste.trim() || url;
    if (!linkedinPaste.trim() && url) {
      toast.error("LinkedIn blocks automated reads. Paste your About, Experience, and Education text below, then click Autofill.");
      return;
    }
    setAutofilling(true);
    const result = await parseLinkedInTextForAutofill(source);
    setAutofilling(false);
    if (result.error || !result.draft) {
      toast.error(result.error || "Could not autofill from that text.");
      return;
    }
    const draft = {
      ...result.draft,
      linkedinUrl: normalizeLinkedInUrl(url) || result.draft.linkedinUrl,
    };
    setValues((current) => mergeDraft(current, draft));
    const customSubjects = (draft.subjects || []).filter((subject) => !(SUBJECTS as readonly string[]).includes(subject));
    const customGrades = (draft.gradeLevels || []).filter((level) => !(GRADE_LEVELS as readonly string[]).includes(level));
    if (customSubjects.length) setSubjectsOther(customSubjects.join(", "));
    if (customGrades.length) setGradeLevelsOther(customGrades.join(", "));
    toast.success("Filled what we could from your LinkedIn text. Review everything before submitting.");
  }

  async function onResumeSelected(file: File | null) {
    setResumeFile(file);
    if (!file) return;

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text();
      const draft = parseProfileText(text);
      if (!Object.keys(draft).length) {
        toast.error("That text resume didn’t have enough recognizable details.");
        return;
      }
      setValues((current) => mergeDraft(current, draft));
      const customSubjects = (draft.subjects || []).filter((subject) => !(SUBJECTS as readonly string[]).includes(subject));
      const customGrades = (draft.gradeLevels || []).filter((level) => !(GRADE_LEVELS as readonly string[]).includes(level));
      if (customSubjects.length) setSubjectsOther(customSubjects.join(", "));
      if (customGrades.length) setGradeLevelsOther(customGrades.join(", "));
      toast.success("Filled from your resume. Review the fields, then finish anything we missed.");
      return;
    }

    setAutofilling(true);
    const body = new FormData();
    body.set("resume", file);
    const result = await parseResumeForAutofill(body);
    setAutofilling(false);
    if (result.error || !result.draft) {
      toast.error(result.error || "Could not autofill from that resume.");
      return;
    }
    setValues((current) => mergeDraft(current, result.draft!));
    const customSubjects = (result.draft.subjects || []).filter((subject) => !(SUBJECTS as readonly string[]).includes(subject));
    const customGrades = (result.draft.gradeLevels || []).filter((level) => !(GRADE_LEVELS as readonly string[]).includes(level));
    if (customSubjects.length) setSubjectsOther(customSubjects.join(", "));
    if (customGrades.length) setGradeLevelsOther(customGrades.join(", "));
    toast.success("Filled from your resume. Review the fields, then finish anything we missed.");
  }

  function firstInvalidMessage(form: HTMLFormElement) {
    const invalid = form.querySelector(":invalid") as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!invalid) return "Please complete the required fields.";
    const label = form.querySelector(`label[for="${invalid.id}"]`)?.textContent?.trim();
    if (invalid.validity.valueMissing) {
      return label ? `Please fill in ${label}.` : "Please complete the required fields.";
    }
    if (invalid.validity.tooShort) {
      return label ? `${label} is too short.` : invalid.validationMessage;
    }
    if (invalid.validity.typeMismatch) {
      return label ? `Enter a valid ${label.toLowerCase()}.` : invalid.validationMessage;
    }
    return invalid.validationMessage || "Please check the form and try again.";
  }

  function confirmAndSubmit() {
    allowSubmitRef.current = true;
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
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
    <>
    <form
      ref={formRef}
      action={action}
      className="grid gap-10"
      encType="multipart/form-data"
      noValidate
      onSubmit={(event) => {
        const form = event.currentTarget;
        if (!form.checkValidity()) {
          event.preventDefault();
          toast.error(firstInvalidMessage(form));
          const invalid = form.querySelector(":invalid") as HTMLElement | null;
          invalid?.focus();
          return;
        }
        if (!signedIn && password !== confirmPassword) {
          event.preventDefault();
          toast.error("Passwords don’t match. Re-enter the same password in both fields.");
          return;
        }
        if (!allowSubmitRef.current) {
          event.preventDefault();
          setConfirmOpen(true);
          return;
        }
        allowSubmitRef.current = false;
      }}
    >
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
      </fieldset>

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">Account</legend>
        <p className="text-xs text-mute">
          Fields marked with <span className="text-[#b42318]">*</span> are required.
        </p>
        <label className="label" htmlFor="name">
          Full name
          <RequiredMark />
        </label>
        <input id="name" className="field" name="name" value={values.name || ""} onChange={(event) => setField("name", event.target.value)} required />
        <label className="label" htmlFor="email">
          Email
          <RequiredMark />
        </label>
        <input id="email" className="field" name="email" type="email" value={values.email || ""} onChange={(event) => setField("email", event.target.value)} required />
        {signedIn ? null : (
          <>
            <div>
              <label className="label" htmlFor="password">
                Password
                <RequiredMark />
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="field pr-12"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-mute hover:text-navy"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-mute">At least 8 characters.</p>
            </div>
            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm password
                <RequiredMark />
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  className="field pr-12"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-pressed={showConfirmPassword}
                  aria-controls="confirmPassword"
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-mute hover:text-navy"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </>
        )}
        <div>
          <label className="label" htmlFor="photo">
            Profile photo
            {requirePhoto ? <RequiredMark /> : null}
          </label>
          <p className="mb-2 text-sm text-mute">A clear headshot tutors and families will see on your profile.</p>
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
        <label className="label md:col-span-2" htmlFor="university">
          University
          <RequiredMark />
        </label>
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

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">Subjects and grades</legend>
        <p className="text-sm text-mute">Choose everything you teach. Add anything missing under Other.</p>
        <p className="label">
          Subjects
          <RequiredMark />
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((subject) => (
            <label key={subject} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="subjects" value={subject} checked={values.subjects?.includes(subject) || false} onChange={() => toggleList("subjects", subject)} />
              {subject}
            </label>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="subjectsOther">
            Other subjects
          </label>
          <input
            id="subjectsOther"
            className="field"
            name="subjectsOther"
            value={subjectsOther}
            onChange={(event) => setSubjectsOther(event.target.value)}
            placeholder="e.g. Music theory, Organic chemistry, LSAT - separate with commas"
          />
        </div>
        <div>
          <p className="label">
            Grade levels
            <RequiredMark />
          </p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {GRADE_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2">
                <input type="checkbox" name="gradeLevels" value={level} checked={values.gradeLevels?.includes(level) || false} onChange={() => toggleList("gradeLevels", level)} />
              {level}
            </label>
          ))}
          </div>
          <label className="label mt-3" htmlFor="gradeLevelsOther">
            Other grade levels
          </label>
          <input
            id="gradeLevelsOther"
            className="field"
            name="gradeLevelsOther"
            value={gradeLevelsOther}
            onChange={(event) => setGradeLevelsOther(event.target.value)}
            placeholder="e.g. Homeschool, Adult learner - separate with commas"
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-serif text-3xl text-navy">Your practice</legend>
        <div>
          <label className="label" htmlFor="bio">
            Biography
            <RequiredMark />
          </label>
          <textarea
            id="bio"
            className="field min-h-32"
            name="bio"
            value={values.bio || ""}
            onChange={(event) => setField("bio", event.target.value)}
            minLength={BIO_MIN}
            required
            aria-describedby="bio-count"
          />
          <p id="bio-count" className={`mt-1 text-xs ${bioReady ? "text-navy" : "text-mute"}`}>
            {bioLength} / {BIO_MIN} characters minimum
            {bioReady ? " · looks good" : ` · ${BIO_MIN - bioLength} more needed`}
          </p>
        </div>

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
      <ApplySubmitFooter />
    </form>

    {confirmOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="apply-confirm-title"
        aria-describedby="apply-confirm-body"
      >
        <div className="w-full max-w-md border border-line bg-white p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
          <p className="kicker">Application</p>
          <h2 id="apply-confirm-title" className="mt-1 font-serif text-3xl text-navy">
            Submit this application?
          </h2>
          <p id="apply-confirm-body" className="mt-2 text-sm leading-6 text-mute">
            We’ll send your materials to the review queue. You can sign in later to check status.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-line whitespace-nowrap" onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary whitespace-nowrap" onClick={confirmAndSubmit}>
              Confirm submit
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
