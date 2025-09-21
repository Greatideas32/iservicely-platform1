# HR Scenario Interview – Next.js Starter

This is a minimal UI scaffold that matches the canvas spec. It includes:
- Public candidate flow (`/interview/[token]`)
- HR dashboard placeholder (`/dashboard`)
- API routes: invite, candidate submit, interview metadata
- Supabase helpers (client and admin)

## Quick start
1. `cp .env.example .env.local` and fill in values.
2. `npm i`
3. `npm run dev`

> NOTE: This starter expects you to have created the Supabase schema & Edge Function `/score` per the canvas document.
