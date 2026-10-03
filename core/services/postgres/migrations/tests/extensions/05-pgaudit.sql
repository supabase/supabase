BEGIN;
create extension if not exists pgaudit with schema "extensions";
ROLLBACK;
