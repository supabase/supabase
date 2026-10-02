WITH pgrst_source AS (
  WITH
  pgrst_payload AS (SELECT '{"id": 4}'::json AS json_data),
  pgrst_body AS ( SELECT CASE WHEN json_typeof(json_data) = 'array' THEN json_data ELSE json_build_array(json_data) END AS val FROM pgrst_payload),
  pgrst_args AS ( SELECT * FROM json_to_recordset((SELECT val FROM pgrst_body)) AS _("id" integer) )
  SELECT "get_projects_below".*
  FROM "test"."get_projects_below"("id" := (SELECT "id" FROM pgrst_args LIMIT 1))
)
SELECT
  null::bigint AS total_result_set,
  pg_catalog.count(_postgrest_t) AS page_total,
  coalesce(json_agg(_postgrest_t), '[]')::character varying AS body,
  nullif(current_setting('response.headers', true), '') AS response_headers,
  nullif(current_setting('response.status', true), '') AS response_status
FROM (SELECT "projects".* FROM "pgrst_source" AS "projects") _postgrest_t;
