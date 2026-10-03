-- prime-multigres.sql
-- Like prime.sql but omits extensions unavailable in multigres images:
--   pgsodium  - requires pgsodium_getkey.sh (not present in multigres images)
--   supabase_vault - requires pgsodium
-- disable notice messages because they differ between versions
set client_min_messages = warning;
create extension if not exists address_standardizer;
create extension if not exists address_standardizer_data_us;
create extension if not exists amcheck;
create extension if not exists autoinc;
create extension if not exists bloom;
create extension if not exists btree_gin;
create extension if not exists btree_gist;
create extension if not exists citext;
create extension if not exists cube;
create extension if not exists dblink;
create extension if not exists dict_int;
create extension if not exists dict_xsyn;
create extension if not exists earthdistance;
create extension if not exists file_fdw;
create extension if not exists fuzzystrmatch;
create extension if not exists http;
create extension if not exists hstore;
create extension if not exists hypopg;
create extension if not exists index_advisor;
create extension if not exists insert_username;
create extension if not exists intagg;
create extension if not exists intarray;
create extension if not exists isn;
create extension if not exists lo;
create extension if not exists ltree;
create extension if not exists moddatetime;
create extension if not exists pageinspect;
create extension if not exists pg_buffercache;

/*
TODO: Does not enable locally mode
requires a change to postgresql.conf to set
cron.database_name = 'testing'
*/
-- create extension if not exists pg_cron;

create extension if not exists pg_net;
create extension if not exists pg_graphql;
create extension if not exists pg_freespacemap;
create extension if not exists pg_hashids;
create extension if not exists pg_prewarm;
create extension if not exists pgmq;
create extension if not exists pg_jsonschema;
create schema if not exists partman;
create extension if not exists pg_partman with schema partman;
create extension if not exists pg_repack;
create extension if not exists pg_stat_monitor;
create extension if not exists pg_stat_statements;
create extension if not exists pg_surgery;
create extension if not exists pg_tle;
create extension if not exists pg_trgm;
create extension if not exists pg_visibility;
create extension if not exists pg_walinspect;
create extension if not exists pgaudit;
create extension if not exists pgcrypto;
create extension if not exists pgtap;
create extension if not exists pgroonga;
create extension if not exists pgroonga_database;
-- pgsodium omitted: requires pgsodium_getkey.sh not present in multigres images
create extension if not exists pgrowlocks;
create extension if not exists pgstattuple;
create extension if not exists plpgsql_check;
create extension if not exists postgis;
create extension if not exists postgis_raster;
create extension if not exists postgis_sfcgal;
create extension if not exists postgis_topology;
create extension if not exists pgrouting; -- requires postgis
create extension if not exists postgres_fdw;
create extension if not exists rum;
create extension if not exists refint;
create extension if not exists seg;
create extension if not exists sslinfo;
create extension if not exists supabase_vault;
create extension if not exists tablefunc;
create extension if not exists tcn;
create extension if not exists tsm_system_rows;
-- create extension if not exists tsm_system_time; not supported in apache license
create extension if not exists unaccent;
create extension if not exists "uuid-ossp";
create extension if not exists vector;
create extension if not exists wrappers;
create extension if not exists xml2;
