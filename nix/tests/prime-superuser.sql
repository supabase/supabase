-- Superuser-only extensions for testing.
--
-- These extensions cannot be installed by a non-superuser session on a
-- hosted Supabase project. They live here (not in prime.sql) so that
-- prime.sql can be sourced by non-superuser contexts (e.g. supadev's
-- engines-with-smoke against hosted projects). Superuser-context harnesses
-- — pg_regress (nix/checks.nix), the docker-image-test, and the local
-- migrate-tool — source this file in addition to prime.sql.
--
-- Categories of extensions in here, mapped to supautils.conf.j2 in
-- ansible/files/postgresql_config:
--
-- 1. "omitted because may be unsafe" — supautils.conf.j2.
--    Covers the entries available in BOTH PG 15 and PG 17 builds. Two more
--    entries from the same list, `adminpack` and `old_snapshot`, were
--    removed from contrib in PG 17 and are loaded directly by
--    nix/tests/sql/z_15_ext_interface.sql for the PG 15 path.
--
-- 2. "omitted because deprecated" — supautils.conf.j2.
--    Not in privileged_extensions, so non-superuser can't install.
--    Note: "deprecated" here is a supautils-policy label, not a
--    build-availability one. These extensions still ship in the PG
--    image; supautils just doesn't auto-elevate non-superusers to
--    install them. As superuser (this file's context), they install
--    fine.
--
-- When adding a new extension here, also update the corresponding category
-- in supautils.conf.j2 (or add a new comment line if the category is new).

set client_min_messages = warning;

-- Category 1: "may be unsafe" per supautils.conf.j2
create extension if not exists file_fdw;
create extension if not exists lo;
create extension if not exists pageinspect;
create extension if not exists pg_freespacemap;
create extension if not exists pg_surgery;
create extension if not exists pg_visibility;

-- Category 2: "deprecated" per supautils.conf.j2
create extension if not exists intagg;
create extension if not exists xml2;
