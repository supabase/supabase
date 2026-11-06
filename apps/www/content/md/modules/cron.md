# Supabase Cron

> Schedule and manage recurring jobs directly in Postgres with pg_cron.

Supabase Cron is a Postgres module that uses the pg_cron extension to schedule and manage recurring jobs. Define schedules with standard cron syntax or natural language, and run jobs that call database functions, Edge Functions, or remote webhooks.

## Key Features

- **Postgres native**: schedule and run jobs directly within your database, no external scheduler needed
- **Cron syntax and natural language**: use familiar cron expressions or plain English to define intervals
- **Sub-minute scheduling**: run jobs as frequently as every 1-59 seconds
- **Real-time monitoring**: track and debug scheduled jobs with built-in observability tools
- **Extensible**: trigger database functions, Supabase Edge Functions, or HTTP webhooks
- **Dashboard management**: create, edit, and monitor jobs through an intuitive UI
- **SQL-based**: manage jobs using simple SQL commands, track changes with Postgres migrations
- **100% open source**: built on pg_cron, a trusted community-driven extension

## Common Use Cases

- Periodic data cleanup or archival
- Scheduled report generation
- Recurring API calls or webhook triggers
- Database maintenance tasks (vacuum, reindex)
- Timed cache invalidation
- Periodic data synchronization between systems

## Technical Details

- Extension: pg_cron (open source)
- Minimum interval: 1 second
- Schedule format: cron syntax (minute/hour/day/month/weekday) or natural language
- Job targets: SQL statements, database functions, Edge Functions, HTTP endpoints
- Monitoring: job run history with status, duration, and error details

## Links

- Documentation: https://supabase.com/docs/guides/cron
- Dashboard: https://supabase.com/dashboard/project/_/integrations/cron/overview
