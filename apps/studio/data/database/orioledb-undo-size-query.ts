import { ident, safeSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError } from '@/types'

export type OrioleDbUndoSizeVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type OrioleDbUndoSizeError = ResponseError

const functionSchema = z.array(z.object({ schema: z.string() })).max(1)
const undoSizeSchema = z.tuple([
  z.object({
    undo_size: z
      .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
      .pipe(z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)),
  }),
])

async function getOrioleDbUndoSize(
  { projectRef, connectionString }: OrioleDbUndoSizeVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { result: functions } = await executeSql<unknown>(
    {
      projectRef,
      connectionString,
      sql: safeSql`
        SELECT namespace.nspname AS schema
        FROM pg_catalog.pg_proc AS proc
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = proc.pronamespace
        JOIN pg_catalog.pg_depend AS dependency
          ON dependency.classid = 'pg_catalog.pg_proc'::regclass
          AND dependency.objid = proc.oid
          AND dependency.deptype = 'e'
        JOIN pg_catalog.pg_extension AS extension
          ON dependency.refclassid = 'pg_catalog.pg_extension'::regclass
          AND dependency.refobjid = extension.oid
        WHERE extension.extname = 'orioledb'
          AND proc.proname = 'orioledb_undo_size'
          AND proc.pronargs = 0
          AND proc.prokind = 'f'
      `,
      queryKey: ['orioledb-undo-size-function'],
    },
    signal
  )

  const [undoFunction] = functionSchema.parse(functions)
  if (!undoFunction) return null

  const { result } = await executeSql<unknown>(
    {
      projectRef,
      connectionString,
      sql: safeSql`
        SELECT COALESCE(SUM(undo_size), 0)::bigint AS undo_size
        FROM ${ident(undoFunction.schema)}.orioledb_undo_size()
      `,
      queryKey: ['orioledb-undo-size'],
    },
    signal
  )

  return undoSizeSchema.parse(result)[0].undo_size
}

export type OrioleDbUndoSizeData = Awaited<ReturnType<typeof getOrioleDbUndoSize>>

export const orioleDbUndoSizeQueryOptions = ({
  projectRef,
  connectionString,
}: OrioleDbUndoSizeVariables) =>
  queryOptions({
    queryKey: databaseKeys.orioleDbUndoSize(projectRef, connectionString),
    queryFn: ({ signal }) => getOrioleDbUndoSize({ projectRef, connectionString }, signal),
    enabled: !!projectRef,
  })
