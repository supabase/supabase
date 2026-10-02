create type "realtime"."equality_op" as enum (
  'eq',
  'neq',
  'lt',
  'lte',
  'gt',
  'gte',
  'in',
  'like',
  'ilike',
  'is',
  'match',
  'imatch',
  'isdistinct'
);

alter type "realtime"."equality_op" owner to "supabase_realtime_admin";
