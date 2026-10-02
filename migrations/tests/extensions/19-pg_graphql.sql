BEGIN;
create schema if not exists "graphql";
create extension if not exists pg_graphql with schema "graphql";
ROLLBACK;
