CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER DATABASE :DBNAME SET request.jwt.claim.id = '-1';

set client_min_messages to warning;
DROP SCHEMA IF EXISTS test, private, postgrest, jwt, public, تست, extensions, v1, v2 CASCADE;
DROP TYPE IF EXISTS jwt_token CASCADE;
