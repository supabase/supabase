---
title = "Supavisor error: 'Circuit breaker open' after password rotation"
date_created = "2026-05-07T09:17:40+00:00"
topics = [ "database", "supavisor" ]
keywords = []
---

If you are seeing `FATAL: Circuit breaker open` with one of the error messages:

- `failed to retrieve database credentials after multiple attempts, new connections are temporarily blocked`
- `too many failed attempts to connect to the database, new connections are temporarily blocked`
- `too many authentication failures, new connections are temporarily blocked`

it indicates that the connection pooler has blocked the origin IP to protect the database.

This typically happens when clients attempt to connect to the pooler (ports 5432 or 6543) using an outdated password after a rotation.

**Why Does This Happen?**

- To prevent overloading the database with failed authentication attempts, Supavisor triggers a circuit breaker.
- Once triggered, the origin IP is blocked for up to 2 minutes.
- If clients continue attempting connections with invalid credentials during this window, the circuit breaker will reapply, effectively extending the lockout.

**How to Resolve This Issue:**

- **Stop clients:** Shut down application instances or services currently attempting to connect to the pooler with the wrong credentials.
- **Update credentials:** Ensure all connection strings and environment variables are updated with the new database password.
- **Restart services:** Resume application traffic and the clients will be able to reconnect after the lockout period has elapsed.

**Prevention:**
To avoid this IP lockout issue in the future, stop application instances before rotating the database password. Only restart your services once the new credentials have been successfully applied to your configuration.
