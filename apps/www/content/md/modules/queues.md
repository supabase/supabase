# Supabase Queues

> Durable message queues with guaranteed delivery, powered by Postgres and pgmq.

Supabase Queues is a Postgres module that uses the pgmq extension to provide durable message queues with exactly-once delivery within a visibility window. Manage queues using SQL, the Supabase client libraries, or the Dashboard.

## Key Features

- **Postgres native**: create and manage queues directly within your database
- **Exactly-once delivery**: messages are delivered exactly once within a configurable visibility window
- **Message archival**: archive messages instead of deleting them for audit trails and future reference
- **Real-time monitoring**: track and manage messages with built-in observability tools
- **Multiple access methods**: manage via SQL, PostgREST API (server-side or client-side), or Dashboard
- **Dashboard management**: create queues, send messages, and monitor processing in real time
- **100% open source**: built on pgmq, a trusted community-driven extension

## Common Use Cases

- Asynchronous task processing
- Event-driven workflows
- Background job scheduling
- Inter-service communication
- Webhook delivery with retry logic
- Order processing and fulfillment pipelines

## Technical Details

- Extension: pgmq (open source)
- Delivery guarantee: exactly-once within visibility window
- Message format: JSONB payload
- Access methods: SQL, PostgREST API, Supabase client libraries
- Monitoring: queue depth, message status, processing metrics

## Links

- Documentation: https://supabase.com/docs/guides/queues
- Dashboard: https://supabase.com/dashboard/project/_/integrations/queues/overview
