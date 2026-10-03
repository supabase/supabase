create schema "realtime" authorization "supabase_admin";

grant usage on schema "realtime" to "anon", "authenticated", "service_role";

grant create, usage on schema "realtime" to "supabase_realtime_admin";
