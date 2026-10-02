-- Start transaction and plan the tests.
BEGIN;
SELECT plan(1);

-- Run the tests.
SELECT pass( 'My test passed, w00t!' );

-- Finish the tests and clean up.
SELECT * FROM finish();
ROLLBACK;
