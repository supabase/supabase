import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'
import { CronJobRun } from './database-cron-jobs-runs-infinite-query'
import minify from 'pg-minify'

const CRON_GET_NEXT_TIME_SQL = minify(/* SQL */ `
CREATE OR REPLACE FUNCTION pg_temp.cron_split_to_arrays(
    cron text,
    OUT mins integer[],
    OUT hours integer[],
    OUT days integer[],
    OUT months integer[],
    OUT dow integer[]
) RETURNS record AS $$
DECLARE
    a_element text[];
    i_index integer;
    a_tmp text[];
    tmp_item text;
    a_range int[];
    a_split text[];
    a_res integer[];
    max_val integer;
    min_val integer;
    dimensions constant text[] = '{"minutes", "hours", "days", "months", "days of week"}';
    allowed_ranges constant integer[][] = '{{0,59},{0,23},{1,31},{1,12},{0,7}}';
BEGIN
    a_element := regexp_split_to_array(cron, '\s+');
    FOR i_index IN 1..5 LOOP
        a_res := NULL;
        a_tmp := string_to_array(a_element[i_index],',');
        FOREACH  tmp_item IN ARRAY a_tmp LOOP
            IF tmp_item ~ '^[0-9]+$' THEN -- normal integer
                a_res := array_append(a_res, tmp_item::int);
            ELSIF tmp_item ~ '^[*]+$' THEN -- '*' any value
                a_range := array(select generate_series(allowed_ranges[i_index][1], allowed_ranges[i_index][2]));
                a_res := array_cat(a_res, a_range);
            ELSIF tmp_item ~ '^[0-9]+[-][0-9]+$' THEN -- '-' range of values
                a_range := regexp_split_to_array(tmp_item, '-');
                a_range := array(select generate_series(a_range[1], a_range[2]));
                a_res := array_cat(a_res, a_range);
            ELSIF tmp_item ~ '^[0-9]+[\/][0-9]+$' THEN -- '/' step values
                a_range := regexp_split_to_array(tmp_item, '/');
                a_range := array(select generate_series(a_range[1], allowed_ranges[i_index][2], a_range[2]));
                a_res := array_cat(a_res, a_range);
            ELSIF tmp_item ~ '^[0-9-]+[\/][0-9]+$' THEN -- '-' range of values and '/' step values
                a_split := regexp_split_to_array(tmp_item, '/');
                a_range := regexp_split_to_array(a_split[1], '-');
                a_range := array(select generate_series(a_range[1], a_range[2], a_split[2]::int));
                a_res := array_cat(a_res, a_range);
            ELSIF tmp_item ~ '^[*]+[\/][0-9]+$' THEN -- '*' any value and '/' step values
                a_split := regexp_split_to_array(tmp_item, '/');
                a_range := array(select generate_series(allowed_ranges[i_index][1], allowed_ranges[i_index][2], a_split[2]::int));
                a_res := array_cat(a_res, a_range);
            ELSE
                RAISE EXCEPTION 'Value ("%") not recognized', a_element[i_index]
                    USING HINT = 'fields separated by space or tab.'+
                       'Values allowed: numbers (value list with ","), '+
                    'any value with "*", range of value with "-" and step values with "/"!';
            END IF;
        END LOOP;
        SELECT
           ARRAY_AGG(x.val), MIN(x.val), MAX(x.val) INTO a_res, min_val, max_val
        FROM (
            SELECT DISTINCT UNNEST(a_res) AS val ORDER BY val) AS x;
        IF max_val > allowed_ranges[i_index][2] OR min_val < allowed_ranges[i_index][1] OR a_res IS NULL THEN
            RAISE EXCEPTION '% is out of range % for %', tmp_item, allowed_ranges[i_index:i_index][:], dimensions[i_index];
        END IF;
        CASE i_index
            WHEN 1 THEN mins := a_res;
            WHEN 2 THEN hours := a_res;
            WHEN 3 THEN days := a_res;
            WHEN 4 THEN months := a_res;
        ELSE
            dow := a_res;
        END CASE;
    END LOOP;
    RETURN;
END;
$$ LANGUAGE PLPGSQL STRICT;

CREATE OR REPLACE FUNCTION pg_temp.cron_months(
    from_ts timestamptz,
    allowed_months int[]
) RETURNS SETOF timestamptz AS $$
    WITH
    am(am) AS (SELECT UNNEST(allowed_months)),
    genm(ts) AS ( --generated months
        SELECT date_trunc('month', ts)
        FROM pg_catalog.generate_series(from_ts, from_ts + INTERVAL '1 year', INTERVAL '1 month') g(ts)
    )
    SELECT ts FROM genm JOIN am ON date_part('month', genm.ts) = am.am
$$ LANGUAGE SQL STRICT;

CREATE OR REPLACE FUNCTION pg_temp.cron_days(
    from_ts timestamptz,
    allowed_months int[],
    allowed_days int[],
    allowed_week_days int[]
) RETURNS SETOF timestamptz AS $$
    WITH
    ad(ad) AS (SELECT UNNEST(allowed_days)),
    am(am) AS (SELECT * FROM pg_temp.cron_months(from_ts, allowed_months)),
    gend(ts) AS ( --generated days
        SELECT date_trunc('day', ts)
        FROM am,
            pg_catalog.generate_series(am.am, am.am + INTERVAL '1 month'
                - INTERVAL '1 day',  -- don't include the same day of the next month
                INTERVAL '1 day') g(ts)
    )
    SELECT ts
    FROM gend JOIN ad ON date_part('day', gend.ts) = ad.ad
    WHERE extract(dow from ts)=ANY(allowed_week_days)
$$ LANGUAGE SQL STRICT;

CREATE OR REPLACE FUNCTION pg_temp.cron_times(
    allowed_hours int[],
    allowed_minutes int[]
) RETURNS SETOF time AS $$
    WITH
    ah(ah) AS (SELECT UNNEST(allowed_hours)),
    am(am) AS (SELECT UNNEST(allowed_minutes))
    SELECT make_time(ah.ah, am.am, 0) FROM ah CROSS JOIN am
$$ LANGUAGE SQL STRICT;


CREATE OR REPLACE FUNCTION pg_temp.cron_runs(
    from_ts timestamp with time zone, 
    cron text
) RETURNS SETOF timestamptz AS $$
    SELECT cd + ct
    FROM
        pg_temp.cron_split_to_arrays(cron) a,
        pg_temp.cron_times(a.hours, a.mins) ct CROSS JOIN
        pg_temp.cron_days(from_ts, a.months, a.days, a.dow) cd
    WHERE cd + ct > from_ts
    ORDER BY 1 ASC;
$$ LANGUAGE SQL STRICT;

CREATE DOMAIN pg_temp.cron AS TEXT CHECK(
    VALUE = '@reboot'
    OR substr(VALUE, 1, 6) IN ('@every', '@after') 
       AND (substr(VALUE, 7) :: INTERVAL) IS NOT NULL
    OR VALUE ~ '^(((\d+,)+\d+|(\d+(\/|-)\d+)|(\*(\/|-)\d+)|\d+|\*) +){4}(((\d+,)+\d+|(\d+(\/|-)\d+)|(\*(\/|-)\d+)|\d+|\*) ?)$'
       AND pg_temp.cron_split_to_arrays(VALUE) IS NOT NULL
);

COMMENT ON DOMAIN pg_temp.cron IS 'Extended CRON-style notation with support of interval values';

-- is_cron_in_time returns TRUE if timestamp is listed in cron expression
CREATE OR REPLACE FUNCTION pg_temp.is_cron_in_time(
    run_at pg_temp.cron, 
    ts timestamptz
) RETURNS BOOLEAN AS $$
    SELECT
    CASE WHEN run_at IS NULL THEN
        TRUE
    ELSE
        date_part('month', ts) = ANY(a.months)
        AND (date_part('dow', ts) = ANY(a.dow) OR date_part('isodow', ts) = ANY(a.dow))
        AND date_part('day', ts) = ANY(a.days)
        AND date_part('hour', ts) = ANY(a.hours)
        AND date_part('minute', ts) = ANY(a.mins)
    END
    FROM
        pg_temp.cron_split_to_arrays(run_at) a
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION pg_temp.next_run(cron pg_temp.cron) RETURNS timestamptz AS $$
    SELECT * FROM pg_temp.cron_runs(now(), cron) LIMIT 1
$$ LANGUAGE SQL STRICT;
`)

export type DatabaseCronJobNextRunVariables = {
  projectRef?: string
  connectionString?: string
  jobId: number
  schedule: string
}

export async function getDatabaseCronJobNextRun({
  projectRef,
  connectionString,
  schedule,
}: Omit<DatabaseCronJobNextRunVariables, 'jobId'>) {
  if (!projectRef) throw new Error('Project ref is required')

  const query = `
${CRON_GET_NEXT_TIME_SQL}
`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: query,
  })

  return result
}

export type DatabaseCronJobNextRunData = CronJobRun
export type DatabaseCronJobNextRunError = ResponseError

export const useCronJobNextRunQuery = <TData = DatabaseCronJobNextRunData>(
  { projectRef, connectionString, jobId, schedule }: DatabaseCronJobNextRunVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobNextRunData, DatabaseCronJobNextRunError, TData> = {}
) =>
  useQuery<DatabaseCronJobNextRunData, DatabaseCronJobNextRunError, TData>(
    databaseCronJobsKeys.nextRun(projectRef, jobId),
    () => getDatabaseCronJobNextRun({ projectRef, connectionString, schedule }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
