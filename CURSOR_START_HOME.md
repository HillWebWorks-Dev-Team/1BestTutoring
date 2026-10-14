# Start here on the home PC

## What to give Cursor

Use the **markdown** file, not the PDF:

1. Open the project after `git pull`
2. New Cursor chat
3. Attach / `@` **`CURSOR_HANDOFF.md`** (source of truth)
4. Optionally paste the short prompt below

`CURSOR_HANDOFF.pdf` is a snapshot only - it can be outdated or hard for Cursor to read. Prefer **`CURSOR_HANDOFF.md`**.

---

## Paste this into a new Cursor chat

```
@CURSOR_HANDOFF.md

Continuing 1% Better Tutoring on this PC after git pull.

Read the handoff first. Then:
1. Confirm local setup (npm install, .env present, npm run dev if needed)
2. Help me run the manual test checklists in the handoff (start with apply pipeline + parent tools unless I say otherwise)
3. Do not push, reseed the shared Supabase DB, or change production secrets unless I explicitly ask

Ask me which checklist to start with if unclear.
```

---

## One-time setup on this PC (if not done)

```bash
git pull origin main
npm install
cp .env.example .env   # only if .env missing - then fill secrets from password manager
npx prisma db push     # only if schema is behind
npm run dev
```

Demo password: `OnePercent!2026`  
Details, tests, email/ops needs: see `CURSOR_HANDOFF.md`.
