---
title = "Auth error: 503 AuthRetryableFetchError"
date_created = "2026-05-07T09:19:37+00:00"
topics = [ "auth" ]
keywords = []
[[errors]]
http_status_code = 503
message = "AuthRetryableFetchError"

---

A `503` status code accompanied by an `AuthRetryableFetchError` typically indicates that the Auth (GoTrue) service is failing to initialize because it cannot load its configuration.

**Why Does This Happen?**
This issue is most commonly caused by an invalid duration string in the `GOTRUE_SESSIONS_TIMEBOX` setting. This occurs if the configured value:

- Exceeds the maximum supported duration (approximately hundreds of years).
- Uses an incorrect or unsupported time unit format.

When the service encounters an invalid configuration value during startup, it fails to initialize, resulting in fetch errors for all authentication requests.

**How to Resolve:**

1. Navigate to the [Sessions](/dashboard/project/_/auth/sessions) settings in the dashboard.
2. Locate the **Timebox** duration field within the **User Sessions** section.
3. Replace the current value with a smaller, valid duration or fallback to the default value (`4320` hours).
4. Save your changes.

Updating this field triggers a configuration reload, which allows the Auth service to restart and resume normal operation.
