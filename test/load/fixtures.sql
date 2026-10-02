\ir ../orioledb.sql

CREATE ROLE postgrest_test_anonymous;
CREATE ROLE postgrest_test_author;
GRANT postgrest_test_anonymous TO :"PGUSER";
GRANT postgrest_test_author TO :"PGUSER";
CREATE SCHEMA test;

-- PUT+PATCH target needs one record and column to modify
CREATE TABLE test.actors (
  PRIMARY KEY (actor),
  actor         INT,
  name          TEXT,
  last_modified TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO test.actors VALUES (1, 'John Doe');

-- POST target needs generated PK
CREATE TABLE test.films (
  id INT PRIMARY KEY,
  title TEXT,
  year TEXT,
  runtime TEXT,
  genres TEXT[],
  director TEXT,
  actors TEXT,
  plot TEXT,
  "posterUrl" TEXT
);

-- DELETE target remains empty
CREATE TABLE test.roles (
  actor     INT REFERENCES test.actors,
  film      INT REFERENCES test.films,
  character TEXT
);

CREATE TABLE test.authors_only ();

CREATE FUNCTION test.call_me (name TEXT) RETURNS TEXT
STABLE LANGUAGE SQL AS $$
  SELECT 'Hello ' || name || ', how are you?';
$$;

GRANT USAGE ON SCHEMA test TO postgrest_test_anonymous, postgrest_test_author;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA test TO postgrest_test_anonymous;

REVOKE ALL PRIVILEGES ON TABLE
      authors_only
FROM postgrest_test_anonymous;

GRANT ALL ON TABLE authors_only TO postgrest_test_author;

SELECT format('CREATE TABLE test.actors_%s ();', n)
FROM generate_series(1, 450) n -- 500 is the upper limit for table not found error hint generation
\gexec

-- TODO add many function for fuzzy search (somehow this is making the loadtest start slow)
