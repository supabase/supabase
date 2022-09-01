import { UseQueryOptions } from '@tanstack/react-query'
import {
  ExecuteQueryData,
  useExecuteQueryPrefetch,
  useExecuteQueryQuery,
} from '../sql/execute-query-query'
import { Workbook } from './workbooks-query'

export const WORKBOOKS_QUERY = (id: string | undefined) => {
  if (!id) {
    throw new Error('id is required')
  }

  return /* SQL */ `
    select
      jsonb_build_object(
        'id', w.id,
        'created_at', w.created_at,
        'title', w.title,
        'blocks',
          coalesce(
            jsonb_agg(
              jsonb_build_object(
                'id', b.id,
                'created_at', b.created_at,
                'body', b.body
              )
            ) filter (where b is not null),
          '[]')
      ) as "workbook"
    from
    supabase_workbook.workbooks w
    left join supabase_workbook.blocks b on b.workbook_id = w.id
    where w.id = '${id}'::uuid
    group by w.id
    limit 1;
  `
}

export type Block = {
  id: string
  created_at: string
  body: string
}

export type WorkbookWithBlocks = Workbook & {
  blocks: Block[]
}

export type WorkbookVariables = {
  id?: string
  projectRef?: string
  connectionString?: string
}

export type WorkbookData = { workbook: WorkbookWithBlocks | null }
export type WorkbookError = unknown

export const useWorkbookQuery = <TData extends WorkbookData = WorkbookData>(
  { projectRef, connectionString, id }: WorkbookVariables,
  options: UseQueryOptions<ExecuteQueryData, WorkbookError, TData> = {}
) =>
  useExecuteQueryQuery(
    { projectRef, connectionString, sql: WORKBOOKS_QUERY(id) },
    {
      select(data) {
        return { workbook: data.result[0]?.workbook ?? null } as TData
      },
      enabled: typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )

export const useWorkbookPrefetch = ({ projectRef, connectionString, id }: WorkbookVariables) => {
  return useExecuteQueryPrefetch({ projectRef, connectionString, sql: WORKBOOKS_QUERY(id) })
}
