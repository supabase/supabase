-- Loads all fixtures for the PostgREST tests

\set ON_ERROR_STOP on

\ir ../../orioledb.sql
\ir database.sql
\ir roles.sql
\ir schema.sql
\ir jwt.sql
\ir jsonschema.sql
\ir privileges.sql
\ir data.sql
