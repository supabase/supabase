import minify from 'pg-minify'

export const DBDEV_INSTALLATION_SQL = minify(
  /* SQL */ `
create extension if not exists http with schema extensions;
create extension if not exists pg_tle;
select pgtle.uninstall_extension_if_exists('supabase-dbdev');
drop extension if exists "supabase-dbdev";
select
    pgtle.install_extension(
        'supabase-dbdev',
        resp.contents ->> 'version',
        'PostgreSQL package manager',
        resp.contents ->> 'sql'
    )
from http(
    (
        'GET',
        'https://api.database.dev/rest/v1/'
        || 'package_versions?select=sql,version'
        || '&package_name=eq.supabase-dbdev'
        || '&order=version.desc'
        || '&limit=1',
        array[
            ('apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s')::http_header
        ],
        null,
        null
    )
) x,
lateral (
    select
        ((row_to_json(x) -> 'content') #>> '{}')::json -> 0
) resp(contents);
create extension "supabase-dbdev";
select dbdev.install('supabase-dbdev');
drop extension if exists "supabase-dbdev";
create extension "supabase-dbdev";
`,
  { compress: true, removeAll: true }
)

// The following are all derived from this guide that explains RLS testing with pgtap
// https://usebasejump.com/blog/testing-on-supabase-with-pgtap
export const SUPABASE_TEST_HELPERS_SQL_WRAPPER = (sql: string) =>
  minify(
    /* SQL */ `
begin;
create extension "basejump-supabase_test_helpers";
${sql}
select * from finish();
rollback;
    `,
    { compress: true, removeAll: true }
  )

export const SUPABASE_TEST_HELPERS_CREATE_TEST_USER = minify(
  /* SQL */ `select tests.create_supabase_user('test_user'); select tests.authenticate_as('test_user');`,
  { compress: true, removeAll: true }
)

export const SUPABASE_TEST_HELPERS_CLEAR_AUTH = minify(
  /* SQL */ `select tests.clear_authentication();`,
  { compress: true, removeAll: true }
)
