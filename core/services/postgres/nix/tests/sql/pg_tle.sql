set client_min_messages = warning;

select
  pgtle.install_extension(
    'pg_distance',
    '0.1',
    'Distance functions for two points',
    $_pg_tle_$
      CREATE FUNCTION dist(x1 float8, y1 float8, x2 float8, y2 float8, norm int)
      RETURNS float8
      AS $$
        SELECT (abs(x2 - x1) ^ norm + abs(y2 - y1) ^ norm) ^ (1::float8 / norm);
      $$ LANGUAGE SQL;

      CREATE FUNCTION manhattan_dist(x1 float8, y1 float8, x2 float8, y2 float8)
      RETURNS float8
      AS $$
        SELECT dist(x1, y1, x2, y2, 1);
      $$ LANGUAGE SQL;

      CREATE FUNCTION euclidean_dist(x1 float8, y1 float8, x2 float8, y2 float8)
      RETURNS float8
      AS $$
        SELECT dist(x1, y1, x2, y2, 2);
      $$ LANGUAGE SQL;
    $_pg_tle_$
  );

create extension pg_distance;

select manhattan_dist(1, 1, 5, 5)::numeric(10,2);
select euclidean_dist(1, 1, 5, 5)::numeric(10,2);

SELECT pgtle.install_update_path(
  'pg_distance',
  '0.1',
  '0.2',
  $_pg_tle_$
    CREATE OR REPLACE FUNCTION dist(x1 float8, y1 float8, x2 float8, y2 float8, norm int)
    RETURNS float8
    AS $$
      SELECT (abs(x2 - x1) ^ norm + abs(y2 - y1) ^ norm) ^ (1::float8 / norm);
    $$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

    CREATE OR REPLACE FUNCTION manhattan_dist(x1 float8, y1 float8, x2 float8, y2 float8)
    RETURNS float8
    AS $$
      SELECT dist(x1, y1, x2, y2, 1);
    $$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

    CREATE OR REPLACE FUNCTION euclidean_dist(x1 float8, y1 float8, x2 float8, y2 float8)
    RETURNS float8
    AS $$
      SELECT dist(x1, y1, x2, y2, 2);
    $$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;
  $_pg_tle_$
  );


select
  pgtle.set_default_version('pg_distance', '0.2');

alter extension pg_distance update;

drop extension pg_distance;

select
  pgtle.uninstall_extension('pg_distance');

-- Restore original state if any of the above fails
drop extension pg_tle cascade;

create extension pg_tle;
