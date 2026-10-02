-- These schemas are created by extension to house all tiger related functions, owned by supabase_admin
grant usage on schema tiger, tiger_data to postgres with grant option;
-- Give postgres permission to all existing entities, also allows postgres to grant other roles
grant all on all tables in schema tiger, tiger_data to postgres with grant option;
grant all on all routines in schema tiger, tiger_data to postgres with grant option;
grant all on all sequences in schema tiger, tiger_data to postgres with grant option;
-- Update default privileges so that new entities are also accessible by postgres
alter default privileges in schema tiger, tiger_data grant all on tables to postgres with grant option;
alter default privileges in schema tiger, tiger_data grant all on routines to postgres with grant option;
alter default privileges in schema tiger, tiger_data grant all on sequences to postgres with grant option;
