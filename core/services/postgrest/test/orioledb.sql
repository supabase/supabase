SELECT EXISTS (SELECT * FROM pg_available_extensions WHERE name = 'orioledb') AS is_orioledb_available \gset

\if :is_orioledb_available
  CREATE SCHEMA orioledb;
  CREATE EXTENSION orioledb WITH SCHEMA orioledb;
\endif
