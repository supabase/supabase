import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type GetInvolvedIndexesFromSelectQueryVariables = {
  projectRef?: string
  connectionString?: string
  query: string
}

export type GetInvolvedIndexesFromSelectQueryResponse = {
  name: string
  schema: string
  table: string
}

// [Joshen] This is experimental - hence why i'm chucking a create or replace query like this here
// [Alaister] Based on: https://github.com/supabase/index_advisor/blob/ddb9b4ed17692ef8dbf049fad806426a851a3079/index_advisor--0.2.0.sql

export async function getInvolvedIndexesInSelectQuery({
  projectRef,
  connectionString,
  query,
}: GetInvolvedIndexesFromSelectQueryVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  try {
    const { result } = await executeSql({
      projectRef,
      connectionString,
      queryKey: ['involved-indexes-explain-query'],
      sql: /* sql */ `
        create or replace function pg_temp.explain_query(query text) returns jsonb
        language plpgsql
        as $$
        declare
            explain_result jsonb;
            prepared_statement_name text := 'query_to_explain';
            explain_plan_statement text;
            n_args int;
        begin
            -- Remove comment lines (its common that they contain semicolons)
            query := trim(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(query,'\\/\\*.+\\*\\/', '', 'g'),
                    '--[^\\r\\n]*', ' ', 'g'),
                '\\s+', ' ', 'g')
            );
      
            -- Remove trailing semicolon
            query := regexp_replace(query, ';\\s*$', '');

            -- Disallow multiple statements
            if query ilike '%;%' then
                raise exception 'Query must not contain a semicolon';
            end if;
        
            -- Hack to support PostgREST because the prepared statement for args incorrectly defaults to text
            query := replace(query, 'WITH pgrst_payload AS (SELECT $1 AS json_data)', 
                                    'WITH pgrst_payload AS (SELECT $1::json AS json_data)');
        
            -- Create a prepared statement for the given query
            deallocate all;
            execute format('prepare %I as %s', prepared_statement_name, query);
        
            -- Detect how many arguments are present in the prepared statement
            n_args = (
                select
                    coalesce(array_length(parameter_types, 1), 0)
                from
                    pg_prepared_statements
                where
                    name = prepared_statement_name
                limit
                    1
            );
        
            -- Create a SQL statement that can be executed to collect the explain plan
            explain_plan_statement = format(
                'set local plan_cache_mode = force_generic_plan; explain (format json) execute %I%s',
                prepared_statement_name,
                case
                    when n_args = 0 then ''
                    else format(
                        '(%s)', array_to_string(array_fill('null'::text, array[n_args]), ',')
                    )
                end
            );
        
            -- Execute the explain plan statement and get the result
            execute explain_plan_statement into explain_result;
        
            -- Clean up the prepared statement
            deallocate all;
        
            -- Return the explain result
            return explain_result;
        end;
        $$;

        select pg_temp.explain_query('${query}') as plans;
      `,
    })

    const involvedIndexes = findIndexNames(result)

    if (involvedIndexes.length <= 0) return []

    const { result: indexResult } = await executeSql({
      projectRef,
      connectionString,
      queryKey: ['involved-indexes-names'],
      sql: `select schemaname as schema, tablename as table, indexname as name from pg_indexes where indexname in (${involvedIndexes.map((name) => `'${name}'`).join(', ')});`,
    })

    return indexResult as GetInvolvedIndexesFromSelectQueryResponse[]
  } catch (err) {
    return []
  }
}

export type GetInvolvedIndexesFromSelectQueryData = Awaited<
  ReturnType<typeof getInvolvedIndexesInSelectQuery>
>
export type GetInvolvedIndexesFromSelectQueryError = ResponseError

export const useGetIndexesFromSelectQuery = <TData = GetInvolvedIndexesFromSelectQueryData>(
  { projectRef, connectionString, query }: GetInvolvedIndexesFromSelectQueryVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    GetInvolvedIndexesFromSelectQueryData,
    GetInvolvedIndexesFromSelectQueryError,
    TData
  > = {}
) => {
  // [Joshen] Only get indexes for queries starting with these
  const formattedQuery = (query ?? '').trim().toLowerCase()
  const isValidQueryForIndexing =
    formattedQuery.startsWith('select') ||
    formattedQuery.startsWith('with pgrst_source') ||
    formattedQuery.startsWith('with pgrst_payload')

  return useQuery<
    GetInvolvedIndexesFromSelectQueryData,
    GetInvolvedIndexesFromSelectQueryError,
    TData
  >(
    databaseKeys.indexesFromQuery(projectRef, query),
    () => getInvolvedIndexesInSelectQuery({ projectRef, connectionString, query }),
    {
      retry: false,
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof query !== 'undefined' &&
        isValidQueryForIndexing,
      ...options,
    }
  )
}

// Helper functions

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

function findIndexNames(obj: JsonValue): string[] {
  const results: string[] = []

  function traverse(current: JsonValue): void {
    if (current === null || typeof current !== 'object') return

    if ('Index Name' in current) {
      results.push(current['Index Name'] as string)
    }

    Object.values(current).forEach((value) => traverse(value))
  }

  traverse(obj)

  return results
}
