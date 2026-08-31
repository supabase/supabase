---
title = "Troubleshooting 'CONNECT_TIMEOUT' or hanging queries in Serverless Functions"
date_created = "2026-06-08T10:04:54+00:00"
topics = [ "database", "functions", "supavisor" ]
keywords = []
[[errors]]
code = "CONNECT_TIMEOUT"
message = "connection timeout errors"
---

Intermittent `CONNECT_TIMEOUT` errors or queries that hang until reaching the execution limit may occur when using persistent clients, such as `postgres-js`, within Serverless Functions.

**Why Does This Happen?**
Serverless environments may freeze the function between requests. This causes TCP sockets to go stale because the connection pooler or NAT may drop inactive connections while the client-side `keepalive` timers are paused. Upon resuming the function, the client attempts to reuse the dead socket, leading to a hang.

**How to Resolve This:**

- **Use the Data API:** Migrate read-heavy workloads to the Supabase Data API (PostgREST). This uses stateless HTTP requests and avoids persistent TCP socket issues.
- **Liveness Preflight:** For transactional paths using `postgres-js`, implement a preflight check by racing a `SELECT 1` query against a short timeout (e.g., a few seconds) before executing the primary query. If the preflight times out, recycle the database client.
- **Migrate to Vercel Fluid Compute:** Use Vercel's Fluid Compute with `attachDatabasePool`. This environment supports the `waitUntil` hook, which allows the runtime to close idle connections properly before the instance suspends.
- **Application Retries:** Implement application-level retry logic specifically for connection timeout errors to force a new connection attempt.
