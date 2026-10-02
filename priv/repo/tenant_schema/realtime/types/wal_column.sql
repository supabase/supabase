create type "realtime"."wal_column" as (
  "name"          text,
  "type_name"     text,
  "type_oid"      oid,
  "value"         jsonb,
  "is_pkey"       boolean,
  "is_selectable" boolean
);

alter type "realtime"."wal_column" owner to "supabase_realtime_admin";
