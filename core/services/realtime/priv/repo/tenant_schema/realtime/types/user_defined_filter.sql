create type "realtime"."user_defined_filter" as (
  "column_name" text,
  "op"          realtime.equality_op,
  "value"       text,
  "negate"      boolean
);

alter type "realtime"."user_defined_filter" owner to "supabase_realtime_admin";
