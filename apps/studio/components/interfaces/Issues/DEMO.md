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
- [ ] **Ask Assistant**: hover over the finding, a SQL cell or the log events.
- [ ] **Alert issue types and silences**: Filters → Manage alert issue types. Turning a type off hides its alert issues.
- [ ] **Custom log rules**: Filters → Manage alert issue types → New log rule, for example source `function_logs`, filter `m.level:error`, group by `metadata.function_id`. Alert issues appear after the first scheduled run (60s, 5s when fast).
- [ ] **Initial investigations**:
  - `Edge Function errors: stripe-webhook` has a completed investigation and its report.
  - `Edge Function errors: send-email` timed out.
  - `Database connections near the limit` arrives 30s after the first request, stays hidden while its investigation runs (20s), then appears with the report. With `fast`: 3s and 2s.

The investigation reports are scripted stand-ins for the o11y-sre-agent.

## Against real local servers

Run Studio with `LOGFLARE_URL` and `LOGFLARE_PRIVATE_ACCESS_TOKEN` instead of
`ALERT_ISSUES_DEMO`, and start the servers from their repos:

- Logflare: see `Logflare/logflare` → `docs/alert-issues-demo.md`
- Alert issue rules with Terraform: see `supabase/terraform-provider-supabase-analytics` → `examples/alert-issues-demo/`
- Initial investigations: see `supabase/o11y-team-tools` → `o11y-sre-agent/README.md`
