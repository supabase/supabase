CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;
SELECT plan(18);

select has_schema('public');
select has_schema('auth');
select has_schema('storage');
select has_schema('realtime');
select has_schema('pgsodium');
select has_schema('vault');
select has_schema('extensions');

SELECT has_enum('public', 'continents', 'Enum continents should exist');

SELECT has_table('public', 'countries', 'Table countries should exist');
SELECT has_column('public', 'countries', 'id', 'Column id should exist');
SELECT has_column('public', 'countries', 'name', 'Column name should exist');
SELECT has_column('public', 'countries', 'iso2', 'Column iso2 should exist');
SELECT has_column('public', 'countries', 'iso3', 'Column iso3 should exist');
SELECT has_column('public', 'countries', 'continent', 'Column continent should exist');

SELECT has_materialized_view('public', 'european_countries', 'Materialized view european_countries should exist');

SELECT is(
    (SELECT evttags FROM pg_event_trigger WHERE evtname = 'issue_pg_graphql_access'),
    ARRAY['CREATE EXTENSION']::text[],
    'issue_pg_graphql_access should be rescoped to CREATE EXTENSION by the upgrade');
SELECT is(
    (SELECT evttags FROM pg_event_trigger WHERE evtname = 'issue_pg_cron_access'),
    ARRAY['CREATE EXTENSION']::text[],
    'issue_pg_cron_access should be rescoped to CREATE EXTENSION by the upgrade');
SELECT ok(
    (SELECT prosrc LIKE '%graphql.resolve%' FROM pg_proc
      WHERE proname = 'graphql' AND pronamespace = 'graphql_public'::regnamespace),
    'graphql_public.graphql should be the real wrapper after upgrade, not the placeholder');

SELECT * FROM finish();
ROLLBACK;
