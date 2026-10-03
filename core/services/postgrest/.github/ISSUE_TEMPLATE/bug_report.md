---
name: Bug report
about: Create a bug report to help us improve
type: Bug
title: ''
labels: ''
assignees: ''

---

<!--
Before reporting a bug:
If your database schema has changed while the PostgREST server is running,
send the server a SIGUSR1 signal or restart it (http://postgrest.org/en/stable/admin.html#schema-reloading) to ensure the schema cache is not stale. This sometimes fixes apparent bugs.
-->
### Environment

* PostgreSQL version: (if using docker, specify the image)
* PostgREST version: (if using docker, specify the image)
* Operating system:
* Cloud Environment: (if applicable, e.g. AWS, Supabase etc)

### Description of issue

Describe the behavior you expected vs the actual behavior. Include:

- A minimal SQL definition.
- How you make the request to PostgREST (curl command preferred).
- The PostgREST response.
