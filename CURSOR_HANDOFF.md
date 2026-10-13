# Cursor handoff — 1% Better Tutoring

Paste this (or `@CURSOR_HANDOFF.md`) into a new Cursor chat on the work PC after `git pull`.

---

## Prompt to continue

You are continuing work on **1% Better Tutoring** (`one-percent-better`), a Next.js App Router tutoring marketplace.

### Repo / local setup
- Clone/pull `main`, then:
  ```bash
  npm install
  cp .env.example .env   # then fill real secrets (never commit .env)
  npx prisma db push
  npm run db:seed        # optional if DB already seeded on Supabase
  npm run dev
  ```
- **Database:** Supabase Postgres (not SQLite). Schema uses `DATABASE_URL` (pooler) + `DIRECT_URL`.
- Supabase project: `onepercentbettertutoring` / ref `vktfqnguthsitmyslvyu` (us-east-1).
- App: http://localhost:3000
- Demo password for seeded accounts: `OnePercent!2026`
  - Admin: `admin@onepercentbetter.com`
  - Student: `jordan@onepercentbetter.com`
  - Tutor: `maya.chen@onepercentbetter.com`

### Env that must be present locally (from teammate / password manager — not in git)
```
DATABASE_URL=...          # Supabase pooler :6543 ?pgbouncer=true
DIRECT_URL=...            # Supabase session/direct :5432
AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENTS_MODE=stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` locally
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
RESEND_API_KEY=re_...
EMAIL_FROM=1% Better Tutoring <onboarding@resend.dev>   # until domain verified
```

Local Stripe webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Boss vision (source of truth)
Premium Ivy/top-30 tutoring platform: custom booking (not Calendly), free 15-min Zoom consults, admin-controlled student–tutor matching before paid sessions, tutor-set hourly rates, Stripe Connect destination charges with configurable ~70/30 split (platform fee covers processing), Zoom + email + calendars, strong university branding, polished dashboards. Phased: Phase 1 core desk, Phase 2 parents/reviews/referrals/analytics, Phase 3 AI/smart matching/groups.

---

## Already built and verified

### Core product
- Public marketing site (home, about, tutors directory/profiles, subjects, how-it-works, FAQ, contact, safety, terms)
- Student / parent / tutor registration + login (httpOnly signed cookies)
- Tutor application → pending/waitlist → admin approve/reject/request info
- LinkedIn paste + resume PDF/TXT autofill on `/become-a-tutor` (`ApplyForm`, `profile-autofill`, `server/autofill`, `pdf-parse`)
- Admin-controlled assignments; paid tutoring locked until assigned
- Custom booking calendar (consult + paid session), availability, blocks, cancel/reschedule rules
- Student / tutor / parent / admin dashboards
- Messaging, homework, session reports, progress notes
- Reviews model + post-session reviews (basic)
- Referral codes stored on signup (no rewards yet)
- In-app notifications + Resend email when key set
- `.ics` calendar download; Google Calendar OAuth **backend** exists (connect UI incomplete)

### Payments / Zoom / email (wired, test mode)
- Stripe Connect Express, destination charges + application fee (`lib/stripe.ts`, tutor earnings Connect button + progress modal)
- Webhook confirms paid bookings, Zoom create, notifications (`lib/confirm-paid-booking.ts`)
- Zoom Server-to-Server OAuth fixed (token uses **Basic** auth; creates via `/users/me/meetings`)
- Booking summary page after book/pay: `/dashboard/bookings/[id]` (schedule, price, Zoom join, add to calendar)
- Resend smoke-tested; using `onboarding@resend.dev` until real domain verified

### UX / data
- Supabase Postgres (Prisma `postgresql` + `directUrl`)
- Apple-style month calendar (events visible on day cells) — `DashboardCalendar`
- Loading: top progress bar, route `loading.tsx` spinners, booking click modal, confirm/pay modal
- Navbar is clean logo + links only (Ivy letter cluster removed from header)

### Verified recently
- `npm test` → 12/12 pass
- `tsc --noEmit` clean
- Public pages 200; DB connected; Zoom meeting create 201; Resend 200; Stripe CLI webhooks 200

### Helper scripts (optional)
- `scripts/test-zoom.mjs`, `scripts/test-resend.mjs`, `scripts/smoke-db.mjs`
- `scripts/backfill-zoom.mjs <bookingId>`, `scripts/clear-demo-stripe.mjs`

---

## Still to do (priority order)

1. **Google Calendar Connect UI** in student/tutor settings → link to `/api/calendar/google/start` (backend already exists).
2. **University branding pass** — homepage showcase of schools with verified tutors; cohesive marks (not navbar clutter); keep no-endorsement disclaimer.
3. **Marketing design polish** — stronger premium first viewport / motion (boss cited Styldd/Hillbrook quality bar).
4. **Deeper parent tools** — book/pay/progress as full family control, not thin viewer.
5. **Referral rewards** — credits/discounts beyond storing codes.
6. **Reviews / trust loop** — more social proof, optional moderation.
7. **Admin analytics charts** — revenue, consults, retention (tables exist, charts don’t).
8. **Go-live** — live Stripe keys, production webhook URL on Vercel, verified Resend domain (`hello@onepercentbetter.com`), `CRON_SECRET` for reminders.

### Phase 3 (later)
- Smart tutor matching recommendations, AI practice tools, group tutoring.

### Known constraints while developing
- Paid booking requires tutor Stripe Connect complete (`stripeChargesEnabled` + `stripePayoutsEnabled`); only some seed tutors may be ready.
- Keep `PAYMENTS_MODE=stripe` with **test** keys until production cutover.
- Do not commit `.env`.

---

## How to work next
Pick the next item from the priority list, implement against existing patterns in `src/`, keep Phase 1 flows green (`npm test`), and prefer small focused PRs. Ask before destructive DB resets on the shared Supabase project.
