# NextGen Visualizer + Custom CRM (Supabase)

This repo includes:
- Branded landing page at `/`
- Full visualizer at `/visualizer`
- OpenAI photo editing for remodel concepts
- Saved projects/leads in Supabase
- Custom CRM at `/admin/crm`:
  - **Kanban pipeline** + list view
  - Lead detail: status, assignment, follow-up
  - Notes + tasks
  - CSV export
  - Follow-up automation on status changes

## Supabase setup
1) Create a Supabase project
2) Run SQL:
- `supabase/schema.sql`
- `supabase/crm.sql`
3) Create at least one admin user:
- Supabase → Authentication → Users → “Add user” (email + password)

## Environment variables
`.env.local` (and Netlify env vars):
```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_IMAGE_MODEL=gpt-image-1.5

# Supabase (server)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Supabase Auth (client)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Role control (MVP allowlist)
ADMIN_ALLOWLIST_EMAILS=you@nextgen-ne.com,owner@nextgen-ne.com
```

## Requirements
- Node.js **20.9+** (required by Next.js 16)

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Deploy to Netlify
1) Create a new Netlify site connected to this repo.
2) In Netlify → Site configuration → Environment variables, add everything from `.env.example`.
3) Build settings should use:
   - Build command: `npm run build`
   - Publish directory: `.next` (handled automatically by `@netlify/plugin-nextjs`)
4) Deploy.

## Admin / CRM
- Login: `/admin/login`
- CRM: `/admin/crm`
- Lead record: click “Open” on a card/row

### Follow-up automation
When you change status (and no follow-up was set yet), the API auto-sets a default follow-up:
- New → +24h
- Contacted → +2d
- Qualified → +3d
- Estimate Sent → +24h
- Scheduled → +7d
- Won/Lost → none

## Security notes
- Admin API routes require `Authorization: Bearer <access_token>` and validate the session via Supabase.
- Allowlist is enforced by `ADMIN_ALLOWLIST_EMAILS`.
- Replace allowlist + token storage with full role-based auth later (we can extend with RLS + roles table).


## “Complete” CRM extras
Run this SQL after the first two migrations:
- `supabase/complete.sql`

Adds:
- updated_at + last_contacted_at fields
- auto-updated updated_at trigger

Admin pages:
- `/admin/users` manage assignees list


## Branding / Logo
- Current logo is a **placeholder SVG** at `public/logo.svg`.
- Replace it with your real logo (keep the same filename) and it will automatically:
  - show in the header
  - appear as the translucent background watermark overlay
  - appear as the on-page brand badge
