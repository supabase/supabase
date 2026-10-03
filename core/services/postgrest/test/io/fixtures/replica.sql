create schema replica;

create or replace function replica.is_replica() returns bool as $$
  select pg_is_in_recovery();
$$ language sql;

create or replace function replica.get_replica_slot() returns name as $$
  select slot_name from pg_replication_slots limit 1;
$$ language sql;

create table replica.items as select x as id from generate_series(1, 10) x;

create table replica.conflict as select x as id from generate_series(1, 1000000) x;

create view replica.conflict_view as select * from replica.conflict where (pg_sleep(0.01) is not null);

DROP ROLE IF EXISTS postgrest_test_anonymous;
CREATE ROLE postgrest_test_anonymous;

GRANT postgrest_test_anonymous TO :"PGUSER";

GRANT USAGE ON SCHEMA replica TO postgrest_test_anonymous;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA replica
TO postgrest_test_anonymous;
