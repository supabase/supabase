-- Privileges for anonymous
GRANT USAGE ON SCHEMA
      "EXTRA ""@/\#~_-"
    , "SPECIAL ""@/\#~_-"
    , "تست"
    , extensions
    , jwt
    , postgrest
    , public
    , test
    , v1
    , v2
    , "SCHEMA_v3"
TO postgrest_test_anonymous;

-- Schema test objects
SET search_path = test, "تست", pg_catalog;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA
      "SPECIAL ""@/\#~_-"
    , "تست"
    , test
    , v1
    , v2
    , "SCHEMA_v3"
TO postgrest_test_anonymous;

REVOKE ALL PRIVILEGES ON TABLE
      app_users
    , authors_only
    , insertonly
    , limited_article_stars
FROM postgrest_test_anonymous;

GRANT INSERT ON TABLE insertonly TO postgrest_test_anonymous;

GRANT USAGE ON SEQUENCE
      auto_incrementing_pk_id_seq
    , items_id_seq
    , items2_id_seq
    , items3_id_seq
    , callcounter_count
    , leak_id_seq
    , surr_serial_upsert_id_seq
    , surr_gen_default_upsert_id_seq
    , "Surr_Gen_Default_Upsert_id_seq"
TO postgrest_test_anonymous;

GRANT USAGE ON SEQUENCE channels_id_seq TO postgrest_test_anonymous;

-- Privileges for non anonymous users
GRANT USAGE ON SCHEMA test TO postgrest_test_author;
GRANT ALL ON TABLE authors_only TO postgrest_test_author;

GRANT SELECT (article_id, user_id) ON TABLE limited_article_stars TO postgrest_test_anonymous;
GRANT INSERT (article_id, user_id) ON TABLE limited_article_stars TO postgrest_test_anonymous;
GRANT UPDATE (article_id, user_id) ON TABLE limited_article_stars TO postgrest_test_anonymous;

GRANT SELECT(id, email) ON TABLE app_users TO postgrest_test_anonymous;
GRANT INSERT, UPDATE    ON TABLE app_users TO postgrest_test_anonymous;
GRANT DELETE            ON TABLE app_users TO postgrest_test_anonymous;

REVOKE EXECUTE ON FUNCTION privileged_hello(text) FROM PUBLIC; -- All functions are available to every role(PUBLIC) by default
GRANT EXECUTE ON FUNCTION privileged_hello(text) TO postgrest_test_author;

GRANT USAGE ON SCHEMA test TO postgrest_test_default_role;

GRANT ALL ON TABLE artists TO postgrest_test_anonymous;
GRANT ALL ON TABLE albums TO postgrest_test_anonymous;
