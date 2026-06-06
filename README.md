# OzGeeOm — Dine For A Dream

Live companion app for the OzGeeOm **Dine For A Dream** charity evening. Guests scan a QR code,
sign up, vote in live polls, and submit questions that get grouped into themes
for Q&A. Includes a big-screen presenter view and an admin dashboard.

> Branding: clean light theme with South African flag accent colours and the
> OzGeeOm logo. Edit copy in `lib/branding.ts`.

## Routes

| Route      | Purpose                            |
| ---------- | ---------------------------------- |
| `/`        | Landing                            |
| `/join`    | Guest signup (QR destination)      |
| `/live`    | Guest hub — polls, Q&A, schedule   |
| `/present` | Big-screen presenter view          |
| `/admin`   | Run the show (password-protected)  |

## Quick start (tomorrow night)

### 1. Install

```bash
cd ozgeeom
npm install
```

### 2. Supabase

Create a **new** Supabase project (keep it separate from the conference demo).
Run `supabase/schema.sql` in the SQL editor.

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in Supabase keys and set `ADMIN_PASSWORD` to something only your mum /
the host knows.

### 4. Run locally

```bash
npm run dev
```

- **Presenter screen:** http://localhost:3000/present (project on the big screen)
- **Admin:** http://localhost:3000/admin
- **Guests:** scan the QR on `/present` or share `/join`

### 5. Production (live)

**https://dine-for-a-dream.vercel.app**

| Screen    | URL                                              |
| --------- | ------------------------------------------------ |
| Presenter | https://dine-for-a-dream.vercel.app/present      |
| Admin     | https://dine-for-a-dream.vercel.app/admin        |
| Guest QR  | https://dine-for-a-dream.vercel.app/join         |

## Running the evening

1. Open `/present` on the projector — guests scan the QR to join.
2. Log into `/admin` on a laptop or phone.
3. **Polls:** create a question (e.g. raffle favourite, auction item) and tap
   **Open** when ready.
4. **Q&A:** after questions come in, tap **Group questions** to cluster them.
5. **Schedule:** paste or upload the evening agenda, then **Parse & publish**.

## Stack

Next.js · Supabase (Postgres + Realtime) · Vercel AI SDK · Tailwind CSS
