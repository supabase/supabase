import { getPgStatActivitySql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { ResponseError, UseCustomQueryOptions } from '@/types'

type LockWaitEvent =
  | 'relation'
  | 'extend'
  | 'page'
  | 'tuple'
  | 'transactionid'
  | 'virtualxid'
  | 'speculative token'
  | 'object'
  | 'userlock'
  | 'advisory'
  | 'applytransaction'

type ClientWaitEvent = 'ClientRead' | 'ClientWrite' | 'WalSenderWaitForWAL' | 'WalSenderWriteData'

type TimeoutWaitEvent =
  | 'BaseBackupThrottle'
  | 'CheckpointWriteDelay'
  | 'PgSleep'
  | 'RecoveryApplyDelay'
  | 'VacuumDelay'
  | 'VacuumTruncate'

type ActivityWaitEvent =
  | 'ArchiverMain'
  | 'AutoVacuumMain'
  | 'BgWriterHibernate'
  | 'BgWriterMain'
  | 'CheckpointerMain'
  | 'LogicalApplyMain'
  | 'LogicalLauncherMain'
  | 'WalReceiverMain'
  | 'WalSenderMain'
  | 'WalWriterMain'

type BufferPinWaitEvent = 'BufferPin'
type IOWaitEvent = string
type IPCWaitEvent = string
type LWLockWaitEvent = string

/**
 * wait_event_type: What the session is blocked on
 * wait_event: The specific event within that wait type
 * */
type WaitEvent =
  | { wait_event_type: 'Lock'; wait_event: LockWaitEvent }
  | { wait_event_type: 'Client'; wait_event: ClientWaitEvent }
  | { wait_event_type: 'Timeout'; wait_event: TimeoutWaitEvent }
  | { wait_event_type: 'Activity'; wait_event: ActivityWaitEvent }
  | { wait_event_type: 'BufferPin'; wait_event: BufferPinWaitEvent }
  | { wait_event_type: 'Extension'; wait_event: string }
  | { wait_event_type: 'IO'; wait_event: IOWaitEvent }
  | { wait_event_type: 'IPC'; wait_event: IPCWaitEvent }
  | { wait_event_type: 'LWLock'; wait_event: LWLockWaitEvent }
  | { wait_event_type: null; wait_event: null }

export type DatabaseActivity = {
  pid: number
  role_name: string
  application_name: string
  blocked_by: number[]
  query: string | null
  query_start: string | null
  transaction_start: string | null
  state_change: string | null
  state:
    | 'idle'
    | 'active'
    | 'idle in transaction'
    | 'idle in transaction (aborted)'
    | 'fastpath function call'
    | 'disabled'
    | null
} & WaitEvent

export type DatabaseActivityVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabaseActivity(
  { projectRef, connectionString }: DatabaseActivityVariables,
  signal?: AbortSignal
) {
  const sql = getPgStatActivitySql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['activity'] },
    signal
  )

  return (result ?? []).filter(
    (x: DatabaseActivity) => !x.query?.startsWith(sql)
  ) as DatabaseActivity[]
}

export type DatabaseActivityData = Awaited<ReturnType<typeof getDatabaseActivity>>
export type DatabaseActivityError = ResponseError

export const useDatabaseActivityQuery = <TData = DatabaseActivityData>(
  { projectRef, connectionString }: DatabaseActivityVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseActivityData, DatabaseActivityError, TData> = {}
) =>
  useQuery<DatabaseActivityData, DatabaseActivityError, TData>({
    queryKey: databaseKeys.databaseActivity(projectRef),
    queryFn: ({ signal }) => getDatabaseActivity({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
