BEGIN;
create schema if not exists "partman";
create extension if not exists pg_partman with schema "partman";
ROLLBACK;
