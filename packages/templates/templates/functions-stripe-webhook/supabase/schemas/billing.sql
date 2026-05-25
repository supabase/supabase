create table if not exists public.billing_events (
  id text primary key,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);
