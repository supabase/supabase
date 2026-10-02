CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;
SELECT plan(2);

SELECT results_eq(
    'SELECT setting FROM pg_settings where name = ''jit''',
    ARRAY[ 'off' ]
);

select results_eq(
    'SELECT setting FROM pg_settings WHERE name = ''password_encryption''',
    ARRAY[ 'scram-sha-256' ]
);

SELECT * FROM finish();
ROLLBACK;
