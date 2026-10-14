# Cursor handoff — 1% Better Tutoring

Paste this (or `@CURSOR_HANDOFF.md`) into a new Cursor chat on the work PC after `git pull`.

---

## Prompt to continue

You are continuing work on **1% Better Tutoring** (`one-percent-better`), a Next.js App Router tutoring marketplace.

### Repo / local setup
```bash
npm install
cp .env.example .env   # fill secrets — never commit .env
npx prisma db push
npm run db:seed        # optional; destructive to demo data on shared Supabase
npm run dev
```
- **Database:** Supabase Postgres — `DATABASE_URL` (pooler) + `DIRECT_URL`
- Supabase: `onepercentbettertutoring` / ref `vktfqnguthsitmyslvyu` (us-east-1)
- App: http://localhost:3000
- Demo password (all seeded accounts): `OnePercent!2026`
  - Admin: `admin@onepercentbetter.com`
  - Student: `jordan@onepercentbetter.com` (`JORDAN26`, seed $15 credit)
  - Student: `alex@onepercentbetter.com` (referred by `JORDAN26`)
  - Tutor: `maya.chen@onepercentbetter.com`
  - Parent: `danielle@onepercentbetter.com` → Jordan
  - Parent: `anita@onepercentbetter.com` → Sam

### Env (local — not in git)
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
```

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Boss vision
Premium Ivy/top-30 tutoring: custom booking, free 15-min Zoom consults, admin matching before paid sessions, tutor-set rates, Stripe Connect ~70/30 (platform fee absorbs processing), Zoom + email + calendars, university branding, polished dashboards.  
Phase 1 core desk · Phase 2 parents/reviews/referrals/analytics · Phase 3 AI/matching/groups.

---

## Already built (Phase 1 + Phase 2 product)

### Core
- Marketing site (home, about, tutors, subjects, how-it-works, FAQ, contact, safety, terms, become-a-tutor, login/register)
- Auth (student / parent / tutor), httpOnly cookies
- Tutor apply → admin approve/reject/waitlist/request info; LinkedIn + resume autofill; dropdowns + Other; required profile photo
- Admin assignments; paid sessions locked until assigned
- Booking calendar, availability, cancel/reschedule; booking summary `/dashboard/bookings/[id]`
- Student / tutor / parent / admin dashboards
- Messaging, homework, session reports, progress notes
- Notifications + Resend (test from); `.ics` + Google Calendar connect (student / tutor / parent settings)
- Stripe Connect destination charges + webhooks; Zoom Server-to-Server OAuth

### University branding
- `UniversityShowcase`, `public/univ-logos/`, `UniversityMark` (logo or letter fallback)
- `/tutors?university=…`; disclaimer kept; clean navbar

### Parent tools (#4)
- Family desk, `studentId` through browse→book, billing + receipts, rich progress, settings, parent-aware redirects/notifications

### Referral rewards (#5)
- Credit balance + ledger; $15/$15 defaults (admin settings); grant on referred student’s first paid session
- Auto-apply at checkout up to platform commission only (tutor share intact)
- Student Settings share UI; book banner; booking summary breakdown

### Reviews / trust (#6)
- Student “Awaiting your review”; clearer form; notify after session report
- Verified-session badges; home up to 9 reviews; admin `/dashboard/admin/reviews` publish/hide

### Admin analytics (#7)
- `/dashboard/admin/analytics` — revenue area (6 mo), weekly pulse (12 wk), consult/session bars, retention ring + consult→match
- Linked from overview + payments; `src/lib/analytics.ts` + unit tests

### Verified
- `npm test` → **18/18** pass
- Schema on Supabase via `prisma db push`; Prisma client generated
- Earlier smoke: public 200, Zoom 201, Resend 200, Stripe CLI webhooks 200

---

## Still to do

### #8 Go-live (next — ops / config, not feature code)
1. Switch to **live** Stripe keys; set `PAYMENTS_MODE=stripe` in production
2. Vercel production webhook → `/api/stripe/webhook` + `STRIPE_WEBHOOK_SECRET`
3. Verify Resend domain; set `EMAIL_FROM` to `hello@onepercentbetter.com` (or chosen domain)
4. Set `CRON_SECRET` and schedule `/api/cron/reminders`
5. Confirm `NEXT_PUBLIC_APP_URL` is the production URL; Google OAuth redirect URIs include prod callback
6. Final smoke on production (book consult, paid session, Zoom, email, Connect payout)

### Phase 3 (later)
- Smart tutor matching, AI practice tools, group tutoring

### Deferred manual tests (home / when convenient)
**Apply pipeline** — `/become-a-tutor` → admin applications → tutor application status + photo  

**Parent tools** — Danielle/Anita family desk → book with `studentId` → billing receipt → progress goals → cancel/reschedule stays on parent  

**Referrals** — Settings balance; `?ref=JORDAN26`; paid session applies credit; first paid for referred student grants rewards  

**Reviews** — student overview review → profile success → admin hide/publish  

**Analytics** — admin → Analytics; charts populate from succeeded transactions + bookings  

### Optional later polish
- Parent messaging; dedicated parent homework page; multi-parent / unlink / invite-by-token

---

## Constraints
- Paid booking needs tutor Stripe Connect complete (charges + payouts); seed tutors vary
- Stay on **test** Stripe until go-live cutover
- Never commit `.env`
- Ask before destructive reseed on shared Supabase
- Windows: stop `next dev` before `prisma generate` if EPERM on query engine DLL

---

## How to work next
Pick **#8 Go-live** checklist items with the teammate who holds production secrets. Prefer small focused PRs for any code needed; keep `npm test` green.
