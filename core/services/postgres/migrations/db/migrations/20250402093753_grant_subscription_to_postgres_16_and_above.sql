-- migrate:up
DO $$
DECLARE
  major_version INT;
BEGIN
  SELECT current_setting('server_version_num')::INT / 10000 INTO major_version;

  IF major_version >= 16 THEN
    GRANT pg_create_subscription TO postgres;
  END IF;
END $$;

-- migrate:down
