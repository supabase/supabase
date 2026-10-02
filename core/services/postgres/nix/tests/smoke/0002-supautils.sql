BEGIN;
SELECT plan(2);

-- the setting doesn't exist when supautils is not loaded
SELECT throws_ok($$
  select current_setting('supautils.privileged_extensions', false)
$$);

LOAD 'supautils';

-- now it does
SELECT ok(
  current_setting('supautils.privileged_extensions', false) = ''
);

SELECT * FROM finish();
ROLLBACK;
