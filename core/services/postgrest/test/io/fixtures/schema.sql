DROP SCHEMA IF EXISTS v1, test;

CREATE SCHEMA v1;
CREATE SCHEMA test;

CREATE TABLE authors_only ();
CREATE TABLE projects AS SELECT FROM generate_series(1,5);
CREATE TABLE cats(id uuid primary key, name text);
CREATE TABLE items AS SELECT x AS id FROM generate_series(1,5) x;

-- directors and films table can be used for resource embedding tests
CREATE TABLE directors (
  id int primary key,
  name text
);

CREATE TABLE films (
  id int primary key,
  title text,
  director_id int,

  constraint fk_director
    foreign key (director_id) references directors (id)
    on update cascade
    on delete cascade
);

CREATE TABLE awards (
  id int primary key,
  name text,
  year int,
  film_id int references films(id),
  director_id int references directors(id)
);

-- data to test resource embedding
TRUNCATE TABLE directors CASCADE;
INSERT INTO directors
VALUES (1, 'quentin tarantino'),
       (2, 'christopher nolan'),
       (3, 'yorgos lathinmos');

TRUNCATE TABLE films CASCADE;
INSERT INTO films
VALUES (1, 'pulp fiction', 1),
       (2, 'intersteller',2),
       (3, 'dogtooth',3),
       (4, 'reservoir dogs', 1);

DO $do$BEGIN
  IF (SELECT current_setting('server_version_num')::INT >= 150000) THEN
    ALTER ROLE postgrest_test_w_superuser_settings SET log_min_duration_sample = 12345;
    GRANT SET ON PARAMETER log_min_duration_sample to "Postgrest_Test_Authenticator";
  END IF;
END$do$;

create function get_guc_value(name text) returns text as $$
  select nullif(current_setting(name), '')::text;
$$ language sql;

create function v1.get_guc_value(name text) returns text as $$
  select nullif(current_setting(name), '')::text;
$$ language sql;

create function change_max_rows_config(val int, notify bool default false) returns void as $_$
begin
  execute format($$
    alter role "Postgrest_Test_Authenticator" set pgrst.db_max_rows = %L;
  $$, val);
  if notify then
    perform pg_notify('pgrst', 'reload config');
  end if;
end $_$ volatile security definer language plpgsql ;

create function reset_max_rows_config() returns void as $_$
begin
  alter role "Postgrest_Test_Authenticator" reset pgrst.db_max_rows;
end $_$ volatile security definer language plpgsql ;

create function change_db_schema_and_full_reload(schemas text) returns void as $_$
begin
  execute format($$
    alter role "Postgrest_Test_Authenticator" set pgrst.db_schemas = %L;
  $$, schemas);
  perform pg_notify('pgrst', 'reload config');
  perform pg_notify('pgrst', 'reload schema');
end $_$ volatile security definer language plpgsql ;

create function v1.reset_db_schema_config() returns void as $_$
begin
  alter role "Postgrest_Test_Authenticator" reset pgrst.db_schemas;
  perform pg_notify('pgrst', 'reload config');
  perform pg_notify('pgrst', 'reload schema');
end $_$ volatile security definer language plpgsql ;

create function invalid_role_claim_key_reload() returns void as $_$
begin
  alter role "Postgrest_Test_Authenticator" set pgrst.jwt_role_claim_key = 'test';
  perform pg_notify('pgrst', 'reload config');
end $_$ volatile security definer language plpgsql ;

create function notify_do_nothing() returns void as $_$
  notify pgrst, 'nothing';
$_$ language sql;

create function do_nothing() returns void as $_$
$_$ language sql;

create function reset_invalid_role_claim_key() returns void as $_$
begin
  alter role "Postgrest_Test_Authenticator" reset pgrst.jwt_role_claim_key;
  perform pg_notify('pgrst', 'reload config');
end $_$ volatile security definer language plpgsql ;

create function reload_pgrst_config() returns void as $_$
begin
  perform pg_notify('pgrst', 'reload config');
end $_$ language plpgsql ;

create or replace function sleep(seconds double precision) returns void as $$
  select pg_sleep(seconds);
$$ language sql;

create or replace function hello() returns text as $$
  select 'hello'::text;
$$ language sql;

create function drop_change_cats() returns void
language sql security definer
as $$
  drop table cats;
  create table cats(id bigint primary key, name text);
  grant all on table cats to postgrest_test_anonymous;
  notify pgrst, 'reload schema';
$$;

create function change_role_statement_timeout(timeout text) returns void as $_$
begin
  execute format($$
    alter role current_user set statement_timeout = %L;
  $$, timeout);
end $_$ volatile language plpgsql ;

create view items_w_isolation_level as
select
  id,
  current_setting('transaction_isolation', true) as isolation_level
from items;

create function default_isolation_level()
returns text as $$
  select current_setting('transaction_isolation', true);
$$
language sql;

create function serializable_isolation_level()
returns text as $$
  select current_setting('transaction_isolation', true);
$$
language sql set default_transaction_isolation = 'serializable';

create function repeatable_read_isolation_level()
returns text as $$
  select current_setting('transaction_isolation', true);
$$
language sql set default_transaction_isolation = 'REPEATABLE READ';

create function read_committed_isolation_level()
returns text as $$
  select current_setting('transaction_isolation', true);
$$
language sql set default_transaction_isolation = 'read committed';

create or replace function create_function() returns void as $_$
  drop function if exists mult_them(int, int);
  create or replace function mult_them(a int, b int) returns int as $$
    select a*b;
  $$ language sql;
  notify pgrst, 'reload schema';
$_$ language sql security definer;

create or replace function migrate_function() returns void as $_$
  drop function if exists mult_them(int, int);
  create or replace function mult_them(c int, d int) returns int as $$
    select c*d;
  $$ language sql;
  notify pgrst, 'reload schema';
$_$ language sql security definer;

create or replace function get_pgrst_version() returns text
  language sql
as $$
select application_name
from pg_stat_activity
where application_name ilike 'postgrest%'
limit 1;
$$;

create function terminate_pgrst(appname text) returns setof record as $$
select pg_terminate_backend(pid) from pg_stat_activity where application_name iLIKE '%' || appname || '%';
$$ language sql security definer;

create or replace function one_sec_timeout() returns void as $$
  select pg_sleep(3);
$$ language sql set statement_timeout = '1s';

create or replace function four_sec_timeout() returns void as $$
  select pg_sleep(3);
$$ language sql set statement_timeout = '4s';

create function get_postgres_version() returns int as $$
  select current_setting('server_version_num')::int;
$$ language sql;

create or replace function rpc_work_mem() returns items as $$
  select 1
$$ language sql
set work_mem = '6000';

create or replace function rpc_with_one_hoisted() returns items as $$
  select 1
$$ language sql
set work_mem = '3000'
set statement_timeout = '7s';

create or replace function rpc_with_two_hoisted() returns items as $$
  select 1
$$ language sql
set work_mem = '5000'
set statement_timeout = '10s';

create function get_work_mem(items) returns text as $$
  select current_setting('work_mem', true) as work_mem
$$ language sql;

create function get_statement_timeout(items) returns text as $$
  select current_setting('statement_timeout', true) as statement_timeout
$$ language sql;

create function change_db_schemas_config() returns void as $_$
begin
  alter role "Postgrest_Test_Authenticator" set pgrst.db_schemas = 'test';
end $_$ volatile security definer language plpgsql;

create function reset_db_schemas_config() returns void as $_$
begin
  alter role "Postgrest_Test_Authenticator" reset pgrst.db_schemas;
end $_$ volatile security definer language plpgsql ;

create function test.get_current_schema() returns text as $$
  select current_schema()::text;
$$ language sql;

create or replace function root() returns json as $_$
  select '{"swagger": "2.0"}'::json;
$_$ language sql;

create view infinite_recursion as
select * from projects;

create or replace view infinite_recursion as
select * from infinite_recursion;

create or replace function notify_pgrst() returns void as $$
  notify pgrst;
$$ language sql;

create or replace function get_work_mem() returns text as $$
  select current_setting('work_mem', true);
$$ language sql;
