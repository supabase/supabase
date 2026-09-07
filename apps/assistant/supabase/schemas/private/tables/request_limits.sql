create table private.request_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);
alter table private.request_limits enable row level security;
revoke all on private.request_limits from public, anon, authenticated;
