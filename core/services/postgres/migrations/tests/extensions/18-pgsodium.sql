BEGIN;
create schema if not exists "pgsodium";
create extension if not exists pgsodium with schema "pgsodium";
ROLLBACK;
