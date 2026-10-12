# 1% Better Tutoring

A premium tutoring platform for verified tutors from the Ivy League and other top-30 universities. Students browse and book a free 15-minute consultation. Ongoing paid tutoring starts only after an admin assigns the match. Tutors set their own hourly rate. Stripe Connect is set up to pay the tutor 70% and keep a configurable platform commission, with card-processing fees intended to come out of that commission.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Prisma, SQLite locally and PostgreSQL on Vercel
- Signed httpOnly session cookies
- Stripe Connect destination charges with application fees
- Zoom Server-to-Server OAuth, when credentials are present
- Google Calendar OAuth, when credentials are present, plus `.ics` downloads either way
- Resend for email, when a key is present. In-app notifications always work

## Run it locally

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

Every demo account uses the password `OnePercent!2026`.

| Role | Email |
| --- | --- |
| Admin | admin@onepercentbetter.com |
| Student with tutors | jordan@onepercentbetter.com |
| Student with a consultation only | alex@onepercentbetter.com |
| Minor student | sam@onepercentbetter.com |
| Parent | danielle@onepercentbetter.com |
| Approved tutor | maya.chen@onepercentbetter.com |
| Applicant | liam.foster@onepercentbetter.com |

`npm test` checks commission math, calendar slots, and permission rules.

## Deploy on GitHub and Vercel

1. Create a GitHub repository and push this project.
2. Create a Postgres database on [Neon](https://neon.tech) or Vercel Postgres.
3. Run `node scripts/use-postgres.mjs` so Prisma uses PostgreSQL, and commit that schema change.
4. Import the GitHub repo in Vercel. Framework preset: Next.js.
5. Set the environment variables from `.env.example`. `DATABASE_URL` must be the Postgres connection string. Generate a long `AUTH_SECRET`. Set `NEXT_PUBLIC_APP_URL` to the Vercel domain.
6. The build command is `prisma generate && next build`, and `prisma db push` should be run once against the production database before the first real use:

```bash
DATABASE_URL="your-postgres-url" npx prisma db push
DATABASE_URL="your-postgres-url" npm run db:seed
```

SQLite is for local development only. Vercel’s filesystem does not keep a SQLite file.

### Stripe Connect

Keep `PAYMENTS_MODE=demo` until the Stripe account is ready. Demo mode records the same 70/30 split and never charges a card.

For live payouts:

- Create a Stripe account and enable Connect with Express accounts.
- Set `PAYMENTS_MODE=stripe`, `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Point a webhook at `https://your-domain/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.expired`, `account.updated`, `charge.refunded`, `charge.dispute.created`, and `payment_intent.payment_failed`.
- Set `STRIPE_WEBHOOK_SECRET`.

Charges use destination charges. The full session price is collected on the platform. `application_fee_amount` is the platform commission. The remainder is transferred to the tutor’s connected account. Stripe’s processing fee is recorded against the platform side, so the tutor’s promised percentage stays intact.

### Zoom, email, and calendars

- Zoom: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` from a Server-to-Server OAuth app. Until those exist, bookings are still confirmed and the dashboard says the link is waiting.
- Email: `RESEND_API_KEY` and `EMAIL_FROM`.
- Google Calendar: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, with the redirect `https://your-domain/api/calendar/google/callback`.
- Reminders: set `CRON_SECRET`. Vercel Cron calls `/api/cron/reminders` hourly. Hourly crons need a Vercel plan that allows them. The route sends a one-day reminder and a one-hour reminder, and it will not send the same one twice.

## What is in this build

Phase 1 is usable end to end: public site, university monograms for schools that actually have a verified tutor, tutor directory and profiles, student and parent registration, tutor applications and approval, free consultation booking, paid booking after an admin assignment, tutor and student dashboards, messaging, homework, session reports, progress notes, Stripe Connect onboarding, and the admin desk for people, matches, bookings, refunds, safety reports, and commission settings.

Phase 2 pieces already have a place in the product: parent accounts, verified reviews, referral codes, in-app and email notifications, calendar files, Google Calendar when configured, and financial reporting. Phase 3 (recommendations, AI practice tools, group sessions) is intentionally not built yet. The data model is ordinary relational tables so those can be added without a rewrite.

University marks are original monograms, not official logos. The site states that 1% Better Tutoring is not endorsed by those schools.
