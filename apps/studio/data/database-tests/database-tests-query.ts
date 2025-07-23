import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { databaseTestsKeys } from './database-tests-key'

export type DatabaseTest = {
  id: string
  name: string
  query: string
}

export type DatabaseTestsVariables = {
  projectRef?: string
  connectionString?: string
}

// This is a placeholder. Replace with your actual data fetching logic.
const MOCK_TESTS: DatabaseTest[] = [
  {
    id: '0',
    name: '000-setup-tests-hooks',
    query: `
-- install tests utilities
-- install pgtap extension for testing
create extension if not exists pgtap with schema extensions;
/*
---------------------
---- install dbdev ----
----------------------
Requires:
- pg_tle: https://github.com/aws/pg_tle
- pgsql-http: https://github.com/pramsey/pgsql-http
*/
create extension if not exists http with schema extensions;
create extension if not exists pg_tle;
drop extension if exists "supabase-dbdev";
select pgtle.uninstall_extension_if_exists('supabase-dbdev');
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
-- Install test helpers
select dbdev.install('basejump-supabase_test_helpers');
create extension if not exists "basejump-supabase_test_helpers" version '0.0.6';
        `,
  },
  {
    id: '1',
    name: '01_test_users_table',
    query: `
BEGIN;
SELECT plan(1);
SELECT has_table('users');
SELECT * FROM finish();
ROLLBACK;
    `.trim(),
  },
  {
    id: '2',
    name: '02_test_rls_policy',
    query: `
BEGIN;
SELECT plan(1);
SELECT policies_are('public', 'profiles', ARRAY['Profiles are public']);
SELECT * FROM finish();
ROLLBACK;
    `.trim(),
  },
  {
    id: '3',
    name: '03_test_rls_public',
    query: `
begin;
select plan(1);
-- Verify RLS is enabled on all tables in the public schema
select tests.rls_enabled('public');
select * from finish();
rollback;
    `,
  },
]

export async function getDatabaseTests(
  { projectRef, connectionString }: DatabaseTestsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // In a real implementation, you would fetch this from a database or file system.
  // For now, we return mock data.
  // The timeout is to simulate network latency.
  await new Promise((resolve) => setTimeout(resolve, 500))

  return MOCK_TESTS
}

export type DatabaseTestsData = Awaited<ReturnType<typeof getDatabaseTests>>
export type DatabaseTestsError = unknown

export const useDatabaseTestsQuery = <TData = DatabaseTestsData>(
  { projectRef, connectionString }: DatabaseTestsVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseTestsData, DatabaseTestsError, TData> = {}
) =>
  useQuery<DatabaseTestsData, DatabaseTestsError, TData>(
    databaseTestsKeys.list(projectRef),
    ({ signal }) => getDatabaseTests({ projectRef, connectionString }, signal),
    {
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      ...options,
    }
  )
