# Web Store notes

**Category:** Developer Tools · **Distribution:** unlisted (it moves a live session token).

## Permissions

| Permission                             | Why                                                                |
| -------------------------------------- | ------------------------------------------------------------------ |
| `scripting`                            | Read/write `localStorage` in the hosted and local tabs (the sync). |
| `tabs`                                 | Find the signed-in dashboard tab and the local Studio tab by URL.  |
| `storage`                              | Remember the local Studio origin between popups.                   |
| host: `supabase.com`, `supabase.green` | Read the dashboard session to copy.                                |
| host: `localhost`, `127.0.0.1`         | Write the session into local Studio.                               |

No `<all_urls>`, no remote code, no content scripts — everything runs on user click.

## Privacy

Copies the `supabase.dashboard.auth.token` localStorage value from your own
dashboard tab into your own local Studio tab. Nothing is sent anywhere; no
network requests, no analytics, no storage beyond the local-origin preference.
