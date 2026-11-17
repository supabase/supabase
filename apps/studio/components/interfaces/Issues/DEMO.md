# Alert issues demo

Two ways to try the alert issues inbox in self-hosted Studio.

## Mock mode (no Logflare, no agent)

The self-hosted alert issue routes answer from an in-memory simulation of Logflare and the
o11y-sre-agent investigator (`lib/api/self-hosted/alert-issues-demo/`). Everything resets when
the dev server restarts. Mock mode is off on the platform and in production builds.

```sh
cd apps/studio
NEXT_PUBLIC_IS_PLATFORM=false \
ALERT_ISSUES_DEMO=mock \
pnpm dev
```

Open http://localhost:8082/project/default/issues.

| Env                            | Effect                                               |
| ------------------------------ | ---------------------------------------------------- |
| `ALERT_ISSUES_DEMO=mock`       | Turns mock mode on                                   |
| `ALERT_ISSUES_DEMO_SPEED=fast` | Shortens the delays below (for tests and recordings) |

SQL cells, **Open as notebook** and the assistant's queries still run against a real
database, so they need Postgres and postgres-meta: the `db` and `meta` services from the
self-hosted `docker/docker-compose.yml`, with `STUDIO_PG_META_URL` pointing at `meta`
(`http://localhost:8080` when its port is published). Everything else works without them.

### What to try

- [ ] **Inbox and unread**: every alert issue starts unread; opening one marks it read.
- [ ] **Acknowledge, snooze, resolve, reopen**: any open alert issue. `Edge Function errors: resize-image` starts acknowledged.
- [ ] **Log events**: `Edge Function errors: stripe-webhook`. 1h, 24h and 7d ranges, with a spike in the last 30 minutes.
- [ ] **Comments**: `Edge Function errors: stripe-webhook` already has a thread.
- [ ] **Metadata tab**: any alert issue.
- [ ] **Advisors and remediation**: the eight advisor alert issues, for example `RLS Disabled in Public: public.orders`.
- [ ] **SQL cells and Open as notebook**: any advisor alert issue (needs postgres-meta).
- [ ] **Ask Assistant** (out of scope): hover over the finding, a SQL cell or the log events.
- [ ] **Alert issue types and silences**: Filters → Manage alert issue types. Turning a type off hides its alert issues.
- [ ] **Custom log rules**: Filters → Manage alert issue types → New log rule, for example source `function_logs`, filter `m.level:error`, group by `metadata.function_id`. Alert issues appear after the first scheduled run (60s, 5s when fast).
- [ ] **Initial investigations** (out of scope):
  - `Edge Function errors: stripe-webhook` has a completed investigation and its report.
  - `Edge Function errors: send-email` timed out.
  - `Database connections near the limit` arrives 30s after the first request, stays hidden while its investigation runs (20s), then appears with the report. With `fast`: 3s and 2s.

The investigation reports are scripted stand-ins for the o11y-sre-agent.

### Out-of-scope features

Agentic features are out of scope for this demo and hidden by default. Filters → **Show
out-of-scope features** turns them on, and the setting is remembered in this browser.

While they're hidden:

- There are no Ask Assistant buttons, and mentioning `@assistant` in a comment posts a plain comment.
- Comments from Supabase Assistant, including investigation reports, aren't shown.
- The investigation status ("Investigated by Supabase Assistant", or the notice when it didn't finish) isn't shown.

Everything else in the list above works the same either way. Alert issues that wait for an
initial investigation still arrive late in mock mode, because the delay is on the server.

## Against real local servers

Run Studio with `LOGFLARE_URL` and `LOGFLARE_PRIVATE_ACCESS_TOKEN` instead of
`ALERT_ISSUES_DEMO`, and start the servers from their repos:

- Logflare: see `Logflare/logflare` → `docs/alert-issues-demo.md`
- Alert issue rules with Terraform: see `supabase/terraform-provider-supabase-analytics` → `examples/alert-issues-demo/`
- Initial investigations: see `supabase/o11y-team-tools` → `o11y-sre-agent/README.md`

## Notifications

Logflare decides when to notify: its notification policies match alert issue changes (opened,
reopened, still firing after the repeat interval, resolved) and skip silenced, snoozed and
acknowledged alert issues. It doesn't deliver anything itself. It posts each matched change as a
signed event to the control plane, which fans it out.

Self-hosted, Studio is the control plane: `POST /api/platform/alerts/notifications`. It checks the
signature over the raw body, rejects anything older than five minutes, drops repeated event ids
(remembered in memory, per Studio process) and delivers to the receivers the policy names.

| Variable                               | Where    | What                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------- |
| `ALERT_ISSUE_NOTIFIER_SECRET`          | Studio   | Shared secret for Logflare's `X-Logflare-Signature`       |
| `ALERT_ISSUE_WEBHOOK_RECEIVERS`        | Studio   | JSON: receiver name → `{ "url", "secret" }`               |
| `LOGFLARE_ALERT_ISSUE_NOTIFIER_URL`    | Logflare | `http://localhost:8082/api/platform/alerts/notifications` |
| `LOGFLARE_ALERT_ISSUE_NOTIFIER_SECRET` | Logflare | The same value as `ALERT_ISSUE_NOTIFIER_SECRET`           |

Receivers are configuration, not UI: policies name them, and Terraform manages the policies.
Webhook requests follow the [Standard Webhooks](https://www.standardwebhooks.com/) spec
(`webhook-id`, `webhook-timestamp`, `webhook-signature`). A `whsec_` secret holds the base64 key,
as in the spec. The body is `{ type, occurred_at, data: { alert_issue, policy } }`, and
`alert_issue.url` links to the alert issue in Studio (`NEXT_PUBLIC_SITE_URL`, else
`SUPABASE_PUBLIC_URL`, else the request's origin). Studio retries 429s, 5xxs and network errors,
three attempts with a 5 second timeout each.

To watch deliveries, run a webhook sink and point a receiver at it:

```sh
node -e "require('http').createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { console.log(req.headers['webhook-id'], b); res.end() }) }).listen(9000)"
```

```sh
ALERT_ISSUE_NOTIFIER_SECRET=dev-notifier-secret \
ALERT_ISSUE_WEBHOOK_RECEIVERS='{"ops":{"url":"http://localhost:9000/ops","secret":"whsec_ZGV2LXdlYmhvb2stc2VjcmV0"}}' \
NEXT_PUBLIC_IS_PLATFORM=false pnpm dev
```

The issues button in the header shows the number of unread alert issues that aren't resolved,
refreshed every 30 seconds, in mock mode too.

On the hosted platform a control-plane service receives the same signed events and fans them out
through the webhooks and email services; this route isn't served there.
