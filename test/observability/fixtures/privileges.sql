-- Schema test objects
SET search_path = test, pg_catalog;

GRANT USAGE ON SCHEMA test TO postgrest_test_anonymous;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA test TO postgrest_test_anonymous;
REVOKE ALL PRIVILEGES ON TABLE authors_only FROM postgrest_test_anonymous;

GRANT USAGE ON SCHEMA test TO postgrest_test_author;
GRANT ALL ON TABLE authors_only TO postgrest_test_author;
