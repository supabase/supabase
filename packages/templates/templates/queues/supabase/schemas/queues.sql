-- Background job queue with pgmq.
-- See: https://supabase.com/docs/guides/queues

create extension if not exists pgmq;

select pgmq.create('default_jobs');
