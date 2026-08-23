# Trupthi - For Kandaa

A personal, full-screen slideshow letter — not a template. Built to be opened one screen at a time, like a letter being read a page at a time.

## Project structure

```
/project
  /frontend
    index.html       ← the whole site (structure)
    styles.css        ← all styling (paper/letter aesthetic)
    app.js            ← slide navigation, form logic, API calls
    /data
      memories.js     ← EDIT THIS: your real photos, dates, captions
    /images           ← put your photos here
  /backend
    server.js
    /routes/response.js
    /services/supabase.js
    /services/email.js
    package.json
  .env.example
  README.md
```

## 1. Fill in your real content

Open `frontend/data/memories.js` and replace every `[ADD ... HERE]` placeholder with the real thing — memory titles, descriptions, dates, and photo filenames. Nothing was invented for you; everything in the story slides is either your real copy from the brief or a placeholder waiting for you.

Drop your photos into `frontend/images/` and reference them from `memories.js`, e.g. `"images/us-at-the-beach.jpg"`.

There are three specific photo slots worth filling if you have the photos:
- `openingPhoto` — slide 1 (optional)
- `hugPhoto` — slide 4, the most important one
- `timePassedPhoto` — slide 5 (optional)

## 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run:

```sql
create table responses (
  id uuid primary key default gen_random_uuid(),
  response text not null check (response in ('yes', 'talk_first')),
  date date,
  time time,
  message text,
  created_at timestamptz not null default now()
);

alter table responses enable row level security;
-- No public policies are created — only the backend, using the
-- service role key, can read/write this table. That's intentional.
```

3. Copy your **Project URL** and **service_role key** (Settings → API) into your `.env` file. Use the service role key, not the anon key — the anon key is safe for browsers, the service role key is not, which is exactly why it lives only in the backend.

## 3. Set up email notifications

The backend uses SMTP (via Nodemailer), so it works with Gmail, Outlook, or any transactional email provider.

For Gmail:
1. Turn on 2-Step Verification on your Google account.
2. Create an **App Password** (Google Account → Security → App Passwords).
3. Use that app password as `SMTP_PASS` in your `.env` — not your normal Gmail password.

## 4. Configure environment variables

```bash
cp .env.example backend/.env
```

Then fill in `backend/.env` with your real Supabase and SMTP values.

## 5. Run the backend

```bash
cd backend
npm install
npm run dev
```

The server starts on `http://localhost:3001` by default.

## 6. Run the frontend

The frontend is plain HTML/CSS/JS — no build step. The simplest way to preview it locally:

```bash
cd frontend
npx serve .
```

Or just open `index.html` directly in a browser for a quick look (form submission needs the backend running to actually save/notify).

If your backend isn't on `localhost:3001`, set this at the top of the page before `app.js` loads:
```html
<script>window.API_BASE_URL = "https://your-backend-url.com";</script>
```

## 7. Deploy

- **Frontend**: any static host works — Vercel, Netlify, GitHub Pages, Cloudflare Pages.
- **Backend**: Render, Railway, Fly.io, or any Node host. Set the same environment variables from `.env` in your host's dashboard — never commit `.env` itself.
- Update `ALLOWED_ORIGIN` in your backend env to your deployed frontend's real URL once you know it, so CORS is locked down (not left as `*`) in production.

## Notes on the experience itself

- The site is a linear slideshow (slides 1–7), then branches based on her choice on slide 7 — there's no way to make one path feel like "the wrong one" in the UI; both buttons are equal weight, same size, same position every time.
- The date picker won't allow a date in the past, and the submit buttons disable themselves while sending and show a friendly error if something fails, so nothing can be submitted twice by accident.
- `prefers-reduced-motion` is respected throughout — animations fall back to a simple instant state.
>>>>>>> 852119d (Initial_commit)
