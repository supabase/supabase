begin;

-- Test json_matches_schema
create table customer(
    id serial primary key,
    metadata json,

    check (
        json_matches_schema(
            '{
                "type": "object",
                "properties": {
                    "tags": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "maxLength": 16
                        }
                    }
                }
            }',
            metadata
        )
    )
);

insert into customer(metadata)
values ('{"tags": ["vip", "darkmode-ui"]}');

-- Test jsonb_matches_schema
select
  jsonb_matches_schema(
  '{
    "type": "object",
    "properties": {
	  "tags": {
        "type": "array",
        "items": {
          "type": "string",
          "maxLength": 16
        }
      }
      }
  }',
  '{"tags": ["vip", "darkmode-ui"]}'::jsonb
);

-- Test jsonschema_is_valid
select
  jsonschema_is_valid(
  '{
    "type": "object",
    "properties": {
	  "tags": {
        "type": "array",
        "items": {
          "type": "string",
          "maxLength": 16
        }
      }
    }
  }');

-- Test invalid payload
insert into customer(metadata)
values ('{"tags": [1, 3]}');

rollback;
