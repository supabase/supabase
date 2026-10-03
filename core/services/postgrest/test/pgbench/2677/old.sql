WITH
pgrst_payload AS (SELECT '[{"id": 4, "name": "Vier"}, {"id": 5, "name": "Funf", "arr_data": null}, {"id": 6, "name": "Sechs", "arr_data": [1, 2, 3], "field-with_sep": 6}]'::json AS json_data),
pgrst_body AS ( SELECT CASE WHEN json_typeof(json_data) = 'array' THEN json_data ELSE json_build_array(json_data) END AS val FROM pgrst_payload)
INSERT INTO "test"."complex_items"("arr_data", "field-with_sep", "id", "name")
SELECT "arr_data", "field-with_sep", "id", "name"
FROM json_to_recordset ((SELECT val FROM pgrst_body)) AS _ ("arr_data" integer[], "field-with_sep" integer, "id" bigint, "name" text)
RETURNING "test"."complex_items".*
