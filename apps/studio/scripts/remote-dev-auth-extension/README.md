# Remote-dev auth sync (browser extension)

A tiny dev-only Chrome/Chromium extension that copies your Supabase **dashboard
session** from the hosted dashboard (e.g. `supabase.com`) into a local Studio dev
server (`localhost:8082`) so local Studio — running in `REMOTE_DEV` mode — can
authenticate as you against real projects.

It exists because the hosted GoTrue's OAuth/redirect allowlist doesn't include
localhost, so the normal sign-in button bounces you back to the hosted dashboard.
The dashboard session is a plain (non-`HttpOnly`) `localStorage` value, so this
just copies that value across origins — no cookie syncing, no token minting.

See [`../../REMOTE_DEV.md`](../../REMOTE_DEV.md) for the full workflow.

## Install (unpacked)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder.

## Use

1. Sign in on the hosted dashboard in one tab, and open local Studio
   (`http://localhost:8082`) in another.
2. Click the extension → **Sync token & reload**.

It detects the two tabs, copies `supabase.dashboard.auth.token` (and the
`-user` cache), and reloads local Studio. `auth-js` then refreshes the session
against `REMOTE_GOTRUE_URL` from then on.

## Security

- This copies a **live session token**. Only load it unpacked in your own dev
  browser; don't package or publish it.
- It only reads from the hosted-dashboard origins and writes to the local origin
  you configure (default `http://localhost:8082`).
- It's a development aid for `REMOTE_DEV` Studio and has no place in production.
