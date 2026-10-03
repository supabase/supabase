-- migrate:up
grant all privileges on all tables in schema extensions to postgres with grant option;
grant all privileges on all routines in schema extensions to postgres with grant option;
grant all privileges on all sequences in schema extensions to postgres with grant option;
alter default privileges in schema extensions grant all on tables to postgres with grant option;
alter default privileges in schema extensions grant all on routines to postgres with grant option;
alter default privileges in schema extensions grant all on sequences to postgres with grant option;

-- migrate:down

