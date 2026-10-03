INSERT INTO "test"."complex_items"("arr_data", "field-with_sep", "id", "name")
SELECT pgrst_body."arr_data", pgrst_body."field-with_sep", pgrst_body."id", pgrst_body."name"
FROM (
  SELECT '[{"id": 4, "name": "Vier"}, {"id": 5, "name": "Funf", "arr_data": null}, {"id": 6, "name": "Sechs", "arr_data": [1, 2, 3], "field-with_sep": 6}]'::jsonb as json_data
) pgrst_payload,
LATERAL (
  SELECT CASE WHEN jsonb_typeof(pgrst_payload.json_data) = 'array' THEN pgrst_payload.json_data ELSE jsonb_build_array(pgrst_payload.json_data) END AS val
) pgrst_uniform_json,
LATERAL (
  SELECT * FROM jsonb_to_recordset (pgrst_uniform_json.val) AS _ ("arr_data" integer[], "field-with_sep" integer, "id" bigint, "name" text)
) pgrst_body
RETURNING "test"."complex_items".*
