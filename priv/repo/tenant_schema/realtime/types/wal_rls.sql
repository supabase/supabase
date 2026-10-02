create type "realtime"."wal_rls" as (
  "wal"              jsonb,
  "is_rls_enabled"   boolean,
  "subscription_ids" uuid[],
  "errors"           text[]
);

alter type "realtime"."wal_rls" owner to "supabase_realtime_admin";
