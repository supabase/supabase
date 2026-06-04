# Durable workflows template

Adds a Postgres-backed workflow runner for long-running or retryable product work. Use it for imports, exports, document processing, billing reconciliation, AI batch work, or any task that should survive request timeouts.

## How it works

1. Call `public.enqueue_workflow(...)` to create a workflow run and enqueue it in `pgmq`.
2. A `pg_cron` job drains the queue and invokes the `workflow-worker` Edge Function.
3. The worker marks the run `running`, records an attempt, and dispatches by `workflow_type`.
4. Successful runs are marked `succeeded`; failures are retried until `max_attempts`, then moved to `dead_letter`.

## Includes

- `supabase/schemas/workflows.sql` - workflow tables, enqueue helper, queue dispatcher, and cron job
- `supabase/functions/workflow-worker/index.ts` - Edge Function worker scaffold with retry handling

## Configuration

The generated worker intentionally includes a small dispatch registry. Add your workflow handlers inside `handlers` in `workflow-worker/index.ts`.
