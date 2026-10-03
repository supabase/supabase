create type "realtime"."action" as enum (
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
  'ERROR'
);

alter type "realtime"."action" owner to "supabase_realtime_admin";
