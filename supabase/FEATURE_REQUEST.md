# Feature Request: Option to show only direct connection in ORM / Connect snippet

## Summary

Currently, the Supabase dashboard ORM / Connect snippet shows both the connection pooling URL (pooler) and the direct database URL by default:

```bash
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://<USER>:<PASSWORD>@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database
DIRECT_URL="postgresql://<USER>:<PASSWORD>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

While the pooler connection is recommended for apps with many concurrent connections, some developers prefer to use the direct connection for migrations or applications that do not need pooling.

Proposal

Add an option in the dashboard to display only the direct connection snippet (port 5432), removing the pooler line from the snippet.

Benefits

Simplifies setup for developers who want direct DB access.

Reduces confusion for migrations or apps that do not use pooling.

Keeps the current pooler snippet optional for teams that prefer it.

Notes

I understand that the snippet is dynamically generated in the dashboard backend, so direct code edits in this repo are not possible.

This is purely a feature request / proposal for improving the dashboard UX.