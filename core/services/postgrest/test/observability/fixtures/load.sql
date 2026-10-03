-- Loads all fixtures for the PostgREST observability tests

\set ON_ERROR_STOP on

\ir ../../orioledb.sql
\ir database.sql
\ir roles.sql
\ir schema.sql
\ir privileges.sql
