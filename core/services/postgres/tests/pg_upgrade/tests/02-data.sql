CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;
SELECT plan(6);

SELECT results_eq(
    'SELECT count(*)::int FROM public.countries',
    ARRAY[ 249 ]
);

SELECT results_eq(
    'SELECT count(*)::int FROM public.countries where continent = ''Europe''',
    ARRAY[ 45 ]
);

SELECT results_eq(
    'SELECT count(*)::int FROM public.european_countries',
    ARRAY[ 45 ]
);

SELECT results_eq(
    'SELECT count(*) FROM public.countries where continent = ''Europe''',
    'SELECT count(*) FROM public.european_countries'
);

SELECT results_eq(
    'SELECT count(*)::int FROM public.visits',
    ARRAY[ 100 ]
);

-- complete.sh must analyze partitioned parents (vacuumdb skips them)
SELECT ok(
    (SELECT count(*) FROM pg_statistic WHERE starelid = 'public.visits'::regclass) > 0,
    'partitioned parent has statistics after upgrade'
);

SELECT * FROM finish();
ROLLBACK;
