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
      sql: `
CREATE OR REPLACE FUNCTION pg_temp.explain_query(query TEXT) RETURNS JSONB AS $$
DECLARE
    explain_result JSONB;
    prepared_statement_name TEXT := 'query_to_explain';
    n_args INT;
BEGIN
    -- Disallow multiple statements
    IF query ILIKE '%;%' THEN
        RAISE EXCEPTION 'Query must not contain a semicolon';
    END IF;

    -- Construct the parameterized query
    EXECUTE 'PREPARE ' || prepared_statement_name || ' AS ' || query;

    -- Detect how many arguments are present in the prepared statement
    SELECT COALESCE(array_length(parameter_types, 1), 0)
    INTO n_args
    FROM pg_prepared_statements
    WHERE name = prepared_statement_name
    LIMIT 1;

    -- Construct the EXECUTE statement with parameters using dynamic SQL construction
    IF n_args > 0 THEN
        EXECUTE 'EXPLAIN (FORMAT JSON) EXECUTE ' || prepared_statement_name || '(' || quote_literal($1) || ')' INTO explain_result;
    ELSE
        EXECUTE 'EXPLAIN (FORMAT JSON) EXECUTE ' || prepared_statement_name INTO explain_result;
    END IF;

    -- Deallocate the prepared statement
    EXECUTE 'DEALLOCATE ' || prepared_statement_name;

    -- Return the explain result
    RETURN explain_result;
END;
$$ LANGUAGE plpgsql;
select pg_temp.explain_query('${query}') as plans;
`.trim(),
    })

    const involvedIndexes = result[0].plans
      .filter((plan: any) => 'Index Name' in plan['Plan'])
      .map((plan: any) => `'${plan['Plan']['Index Name']}'`)

    if (involvedIndexes.length === 0) return []

    const { result: indexResult } = await executeSql({
      projectRef,
      connectionString,
      sql: `select schemaname as schema, tablename as table, indexname as name from pg_indexes where indexname in (${involvedIndexes.join(', ')});`,
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
) =>
  useQuery<GetInvolvedIndexesFromSelectQueryData, GetInvolvedIndexesFromSelectQueryError, TData>(
    databaseKeys.indexesFromQuery(projectRef, query),
    () => getInvolvedIndexesInSelectQuery({ projectRef, connectionString, query }),
    {
      retry: false,
      enabled:
        (enabled &&
          typeof projectRef !== 'undefined' &&
          typeof query !== 'undefined' &&
          (query.startsWith('select') || query.startsWith('SELECT'))) ||
        query.trim().toLowerCase().startsWith('with pgrst_source'),
      ...options,
    }
  )
