WITH pgrst_source AS (
  SELECT pgrst_call.*
  FROM (
    SELECT '{"id": 4}'::json as json_data
  ) pgrst_payload,
  LATERAL (
    SELECT CASE WHEN json_typeof(pgrst_payload.json_data) = 'array' THEN pgrst_payload.json_data ELSE json_build_array(pgrst_payload.json_data) END AS val
  ) pgrst_uniform_json,
  LATERAL (
    SELECT * FROM json_to_recordset(pgrst_uniform_json.val) AS _("id" integer) LIMIT 1
  ) pgrst_body,
  LATERAL "test"."get_projects_below"("id" := pgrst_body.id) pgrst_call
)
SELECT
  null::bigint AS total_result_set,
  pg_catalog.count(_postgrest_t) AS page_total,
  coalesce(json_agg(_postgrest_t), '[]')::character varying AS body,
  nullif(current_setting('response.headers', true), '') AS response_headers,
  nullif(current_setting('response.status', true), '') AS response_status
FROM (SELECT "projects".* FROM "pgrst_source" AS "projects") _postgrest_t;
