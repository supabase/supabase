grant all on all tables in schema repack to postgres;
grant all on schema repack to postgres;
alter default privileges in schema repack grant all on tables to postgres;
alter default privileges in schema repack grant all on sequences to postgres;
