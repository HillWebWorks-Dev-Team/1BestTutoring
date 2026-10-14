# Cursor handoff — 1% Better Tutoring

Paste this (or `@CURSOR_HANDOFF.md`) into a new Cursor chat after `git pull`.

**Branch note:** Phase 2 work was committed locally on `main` (`Ship Phase 2 desk…`). If push failed with GitHub 403, push with an account that has write access to `HillWebWorks-Dev-Team/1BestTutoring`.

---

## What we did (this stretch)

Product work completed through Phase 2 items **#1–#7**. Summary for the boss / next engineer:

| Area | What shipped |
|------|----------------|
| **Marketing polish** | Homepage redesign (full-bleed hero, university showcase/carousel, reviews), become-a-tutor redesign, about / tutors / subjects / how-it-works / FAQ aligned; header nav cleaned (Become a tutor in); active underline |
| **University branding** | Real logos in `public/univ-logos/`; `UniversityMark` on tutor cards; filter by school; no-endorsement disclaimer |
| **Tutor apply** | Dropdowns + Other (`SelectWithOther`); required profile photo; LinkedIn/resume autofill kept; admin applications show photos |
| **Google Calendar** | Connect/disconnect UI in student, tutor, **and parent** settings; OAuth callback role-aware |
| **Parent tools (#4)** | Full family desk: book/pay with `studentId` continuity, billing + receipts, rich progress (homework/goals/metrics), settings, parent redirects + notifications |
| **Referral rewards (#5)** | Credit balance + ledger; grant $15/$15 (admin-configurable) after referred student’s first paid session; auto-apply at checkout from **platform fee only**; student Settings share UI |
| **Reviews / trust (#6)** | “Awaiting your review” on student home; clearer review form; notify after session report; verified badges; admin publish/hide at `/dashboard/admin/reviews` |
| **Admin analytics (#7)** | `/dashboard/admin/analytics` — revenue charts, consult/session mix, retention ring; linked from overview + payments |
| **Handoff / quality** | Schema pushed to Supabase; `npm test` **18/18**; handoff doc kept current |

**Not done in code this stretch:** production go-live cutover (keys, domain email, cron on Vercel), Phase 3 features, optional parent messaging/multi-guardian.

---

## What still needs to be done

### Next: #8 Go-live (ops / config — needs secrets + DNS)
1. Production Stripe **live** keys + Connect live mode; keep `PAYMENTS_MODE=stripe`
2. Stripe production webhook → `https://<prod-host>/api/stripe/webhook` + matching `STRIPE_WEBHOOK_SECRET`
3. Resend: **verify sending domain** (see Email section below); stop using `onboarding@resend.dev`
4. Set production `EMAIL_FROM` (target: `1% Better Tutoring <hello@onepercentbetter.com>`)
5. Set `CRON_SECRET`; ensure Vercel Cron hits `/api/cron/reminders` (hourly — plan must allow hourly crons)
6. Production `NEXT_PUBLIC_APP_URL`; Google OAuth redirect URIs include prod `/api/calendar/google/callback`
7. Production smoke: register → consult → assign → paid session → Zoom → email → Connect payout → reminder

### Later / optional product
- Parent messaging (today student↔tutor only)
- Dedicated parent homework page (progress already has read-only board)
- Multi-parent / unlink / invite-by-token
- Phase 3: smart matching, AI practice, group tutoring

### Git
- Push local `main` if still ahead of `origin/main` (use org credentials)

---

## What we need (email, domains, accounts)

Bring these from the teammate / password manager — **never commit `.env`**.

### Email (Resend)
| Need | Detail |
|------|--------|
| `RESEND_API_KEY` | Already used in test; keep for prod |
| **Domain verification** | Add `onepercentbetter.com` (or chosen domain) in Resend → Domains; DNS TXT/DKIM/SPF as Resend shows |
| `EMAIL_FROM` | Local/test today: `1% Better Tutoring <onboarding@resend.dev>` (Resend sandbox — can only send to verified recipient emails in some plans) |
| **Production from** | Target: `1% Better Tutoring <hello@onepercentbetter.com>` (must match verified domain) |
| Inbox to monitor | `hello@onepercentbetter.com` (or support alias) for contact/safety replies outside the app |
| What emails fire | Booking confirm, cancel/reschedule, payment received, session report, review prompt, referral credit, application status, session reminders (cron) — all via `src/lib/notify.ts` → Resend when key set |

Until the domain is verified, treat email as **dev-only**: use `onboarding@resend.dev` and confirm Resend dashboard delivery; don’t expect reliable mail to arbitrary parent/student addresses.

### Stripe
| Need | Detail |
|------|--------|
| Test keys | Current local/dev |
| **Live keys** | For go-live only |
| Webhook secrets | Local: `stripe listen`; Prod: Dashboard endpoint secret |
| Connect | Tutors must finish Express onboarding (`stripeChargesEnabled` + `stripePayoutsEnabled`) before paid sessions |

### Zoom
| Need | Detail |
|------|--------|
| Server-to-Server OAuth | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` |
| App scopes | Meeting create for `/users/me/meetings` |

### Google Calendar
| Need | Detail |
|------|--------|
| OAuth client | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Redirect URI | `{APP_URL}/api/calendar/google/callback` (localhost + production) |

### Hosting / cron
| Need | Detail |
|------|--------|
| Vercel env | All secrets above + `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL` |
| `CRON_SECRET` | Shared secret; cron route rejects without it |
| App URL | Public HTTPS URL for Stripe redirects, Zoom links in email, calendar OAuth |

### Database
| Need | Detail |
|------|--------|
| Supabase | Project `onepercentbettertutoring` / `vktfqnguthsitmyslvyu` |
| Pooler + direct | Both URLs required for Prisma |

---

## What we need to test

Demo password for all seed accounts: **`OnePercent!2026`**

### A. Apply pipeline (home)
1. Log out → `/become-a-tutor` → submit with **photo** + dropdowns (try Other fields)
2. Admin `admin@onepercentbetter.com` → `/dashboard/admin/applications` → open applicant → photo visible → Approve / Waitlist / Request info / Reject
3. Sign in as that tutor → `/dashboard/tutor/application` → status + photo match

### B. Parent family tools
1. Parent `danielle@onepercentbetter.com` or `anita@onepercentbetter.com` → `/dashboard/parent`
2. Per-child **Book** → `/tutors?studentId=…` → profile → book (child stays selected)
3. Free consult; if assigned, paid session + Stripe test pay
4. `/dashboard/parent/billing` filters → open **Receipt**
5. `/dashboard/parent/progress` child tabs → save goals; see homework/notes
6. Calendar cancel/reschedule → stays on **parent** paths; parent gets notifications when applicable

### C. Referral rewards
1. Student `jordan@onepercentbetter.com` → Settings → code `JORDAN26` + credit balance (after seed: $15)
2. New register with `?ref=JORDAN26` (invalid code should error)
3. Book paid session with credit → charge reduced; booking summary shows credit line
4. Referred student’s **first** paid session → both get credit + in-app/email notify
5. Admin → Settings → change referrer/referee USD amounts

### D. Reviews / trust
1. Student with completed unreviewed session → `/dashboard/student` “Awaiting your review” → publish
2. Tutor profile shows success (`?reviewed=1`) + “Verified session”
3. Homepage reviews section (cache up to ~60s)
4. Admin → Reviews → Hide → gone from public; Publish → back

### E. Analytics
1. Admin → `/dashboard/admin/analytics`
2. Confirm revenue / activity / retention reflect succeeded payments and bookings
3. Overview “Open analytics” + Payments “Analytics” links work

### F. Core money / Zoom / email (regression)
1. `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Student books paid session with Connect-ready tutor → checkout → webhook → booking confirmed + Zoom URL
3. With `RESEND_API_KEY` set: confirm Resend shows delivery (to allowed recipients while on sandbox from-address)
4. Google Calendar connect from settings (if Google client configured)

### G. Production go-live smoke (after #8)
1. Real card (small amount) + refund path
2. Email arrives from `hello@…` (not resend.dev)
3. Reminder cron fires once per booking window (check notifications / Resend)
4. Mobile: home hero, tutors, book, parent billing

---

## Local setup (quick)

```bash
npm install
cp .env.example .env   # fill secrets
npx prisma db push
npm run db:seed        # optional; wipes/recreates demo data — ask before shared DB
npm run dev
npm test               # expect 18/18
```

Seed accounts (password `OnePercent!2026`):

| Role | Email |
|------|--------|
| Admin | `admin@onepercentbetter.com` |
| Student | `jordan@onepercentbetter.com` |
| Student | `alex@onepercentbetter.com` |
| Tutor | `maya.chen@onepercentbetter.com` |
| Parent | `danielle@onepercentbetter.com` (Jordan) |
| Parent | `anita@onepercentbetter.com` (Sam) |

### Env template (local)
```
DATABASE_URL=...
DIRECT_URL=...
AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENTS_MODE=stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
RESEND_API_KEY=re_...
EMAIL_FROM=1% Better Tutoring <onboarding@resend.dev>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CRON_SECRET=...
```

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Boss vision (source of truth)

Premium Ivy/top-30 tutoring: custom booking (not Calendly), free 15-min Zoom consults, admin-controlled matching before paid sessions, tutor-set hourly rates, Stripe Connect destination charges ~70/30 (platform fee covers processing), Zoom + email + calendars, strong university branding, polished dashboards.  
**Phase 1** core desk · **Phase 2** parents / reviews / referrals / analytics · **Phase 3** AI / smart matching / groups.

---

## Constraints
- Paid booking requires tutor Stripe Connect complete; only some seed tutors are ready
- Stay on **test** Stripe until go-live cutover
- Never commit `.env`
- Ask before destructive reseed on shared Supabase
- Windows: stop `next dev` before `prisma generate` if EPERM on the query engine DLL

---

## How to work next
1. Finish **manual test** checklists A–F at home when convenient  
2. With ops owner: execute **#8 Go-live** (email domain + Stripe live + cron)  
3. Prefer small focused PRs for any code fixes found in testing; keep `npm test` green
