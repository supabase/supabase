import { isDeepStrictEqual } from 'node:util'
import { reconcileAgentMessages } from '@supabase/agent-runtime'
import { isToolUIPart, type UIMessage } from 'ai'

export interface AgentDatabaseQuery {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: unknown[]
  ): Promise<Row[]>
}

/** Transactions must pin one connection and roll back when the callback rejects. */
export interface AgentDatabase extends AgentDatabaseQuery {
  transaction<Result>(work: (database: AgentDatabaseQuery) => Promise<Result>): Promise<Result>
}

export type AgentStorageTable = { schema: string; name: string }
export type AgentRunStatus =
  | 'running'
  | 'waiting_for_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
export type AgentRunEventType =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'run.cancelled'
  | 'run.waiting_for_approval'
  | 'run.interrupted'
  | 'approval.requested'
  | 'approval.responded'
  | 'tool.started'
  | 'tool.completed'
  | 'tool.failed'

export type AgentRunEvent = {
  cursor: string
  runId: string
  type: AgentRunEventType
  data: Record<string, string | boolean>
  createdAt: string
}

export class AgentStorageError extends Error {
  constructor(
    readonly code: 'not_found' | 'conflict' | 'invalid_input',
    message: string
  ) {
    super(message)
    this.name = 'AgentStorageError'
  }
}

export type AgentSessionScope = { sessionId: string; userId: string }
export type AgentRunScope = AgentSessionScope & { runId: string }
export type AgentStoredSession = Record<string, unknown> & {
  id: string
  user_id: string
  revision: number | string
}
type StoredMessage = Record<string, unknown> & {
  id: string
  role: UIMessage['role']
  parts: UIMessage['parts']
  metadata?: UIMessage['metadata']
}

export type AgentSessionStoreOptions = {
  database: AgentDatabase
  tables?: Partial<
    Record<'sessions' | 'messages' | 'runs' | 'executions' | 'events', AgentStorageTable>
  >
  /** Column names let an existing application adopt the store without moving its history. */
  columns?: { sessionId?: string; activeRunId?: string }
  historyLimit?: number
  activeRunTimeoutMs?: number
}

function identifier(value: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(value)) {
    throw new AgentStorageError('invalid_input', 'Invalid storage identifier.')
  }
  return `"${value}"`
}

function positiveInteger(value: number, name: string, maximum: number) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new AgentStorageError('invalid_input', `Invalid ${name}.`)
  }
  return value
}

/** Assistant owns its schema and the transactional persistence behind the runtime callbacks. */
export function createPostgresSessionStore(options: AgentSessionStoreOptions) {
  const { database } = options
  const table = (
    key: keyof NonNullable<AgentSessionStoreOptions['tables']>,
    name: string,
    schema = 'private'
  ) => {
    const value = options.tables?.[key] ?? { schema, name }
    return `${identifier(value.schema)}.${identifier(value.name)}`
  }
  const sessions = table('sessions', 'conversations', 'public')
  const messages = table('messages', 'messages', 'public')
  const runs = table('runs', 'conversation_runs')
  const executions = table('executions', 'tool_executions')
  const events = table('events', 'run_events')
  const sessionColumn = identifier(options.columns?.sessionId ?? 'conversation_id')
  const activeColumn = identifier(options.columns?.activeRunId ?? 'active_request_id')
  const historyLimit = positiveInteger(options.historyLimit ?? 100, 'history limit', 10_000)
  const activeTimeout = positiveInteger(
    options.activeRunTimeoutMs ?? 150_000,
    'run timeout',
    86_400_000
  )

  async function lock(db: AgentDatabaseQuery, scope: AgentSessionScope) {
    const [session] = await db.query<
      AgentStoredSession & {
        runtime_active_run_id: string | null
        runtime_is_active: boolean
      }
    >(
      `select *, ${activeColumn} as runtime_active_run_id,
      (active_since > now() - ($3::integer * interval '1 millisecond')) as runtime_is_active
      from ${sessions} where id=$1 and user_id=$2 and deleted_at is null for update`,
      [scope.sessionId, scope.userId, activeTimeout]
    )
    if (!session) throw new AgentStorageError('not_found', 'Session not found.')
    return session
  }

  async function appendEvent(
    db: AgentDatabaseQuery,
    scope: AgentRunScope,
    type: AgentRunEventType,
    data: AgentRunEvent['data'] = {}
  ) {
    // All event writers hold the session lock until commit. Cursor order therefore
    // also follows commit order within a session, including concurrent tool calls.
    await db.query(
      `insert into ${events} (${sessionColumn},run_id,user_id,type,data) values ($1,$2,$3,$4,$5)`,
      [scope.sessionId, scope.runId, scope.userId, type, JSON.stringify(data)]
    )
  }

  async function writeMessages(
    db: AgentDatabaseQuery,
    scope: AgentSessionScope,
    incoming: UIMessage[]
  ) {
    for (const message of incoming) {
      const saved = await db.query(
        `insert into ${messages} as stored (id,${sessionColumn},user_id,role,parts,metadata)
        values ($1,$2,$3,$4,$5,$6) on conflict (${sessionColumn},id) do update
        set parts=excluded.parts,metadata=excluded.metadata
        where stored.user_id=excluded.user_id and stored.role=excluded.role returning id`,
        [
          message.id,
          scope.sessionId,
          scope.userId,
          message.role,
          JSON.stringify(message.parts),
          JSON.stringify(message.metadata ?? null),
        ]
      )
      if (!saved.length) throw new AgentStorageError('conflict', 'Message could not be saved.')
    }
  }

  async function readSession(input: AgentSessionScope & { before?: string; limit?: number }) {
    const limit = positiveInteger(input.limit ?? historyLimit, 'message limit', 10_000)
    if (
      input.before !== undefined &&
      (!/^[1-9][0-9]{0,18}$/.test(input.before) ||
        BigInt(input.before) > 9_223_372_036_854_775_807n)
    ) {
      throw new AgentStorageError('invalid_input', 'Invalid message cursor.')
    }
    return database.transaction(async (db) => {
      const stored = await lock(db, input)
      const rows = await db.query<StoredMessage & { seq: string }>(
        `select id,role,parts,metadata,seq::text from ${messages} m
        where ${sessionColumn}=$1 and user_id=$2 and ($3::bigint is null or m.seq < $3::bigint)
        order by m.seq desc limit $4`,
        [input.sessionId, input.userId, input.before ?? null, limit + 1]
      )
      const page = rows.slice(0, limit).reverse()
      const { runtime_active_run_id: _active, runtime_is_active: _isActive, ...session } = stored
      return {
        session: { ...session, revision: Number(session.revision) },
        messages: page.map(
          ({ id, role, parts, metadata }): UIMessage => ({
            id,
            role,
            parts,
            ...(metadata ? { metadata } : {}),
          })
        ),
        before: page[0]?.seq,
        hasMore: rows.length > limit,
      }
    })
  }

  async function startRun<Session extends AgentStoredSession = AgentStoredSession>(
    input: AgentRunScope & {
      revision: number
      incoming: UIMessage[]
      trigger?: string
      reconcile?: (previous: UIMessage[], incoming: UIMessage[]) => Promise<UIMessage[]>
      /** Transactional application metadata writes only; do not make external calls here. */
      onClaim?: (database: AgentDatabaseQuery, session: Session) => Promise<void>
    }
  ) {
    if (!Number.isSafeInteger(input.revision) || input.revision < 0) {
      throw new AgentStorageError('invalid_input', 'Invalid session revision.')
    }
    return database.transaction(async (db) => {
      const stored = await lock(db, input)
      if (Number(stored.revision) !== input.revision) {
        throw new AgentStorageError('conflict', 'The session changed. Reload it before continuing.')
      }
      if (stored.runtime_active_run_id && stored.runtime_is_active) {
        throw new AgentStorageError(
          'conflict',
          'A response is already running. Wait for it to finish.'
        )
      }
      const rows = await db.query<StoredMessage>(
        `select id,role,parts,metadata from ${messages}
        where ${sessionColumn}=$1 and user_id=$2 order by seq desc limit $3`,
        [input.sessionId, input.userId, historyLimit]
      )
      const previous = rows.reverse().map(({ id, role, parts, metadata }) => ({
        id,
        role,
        parts,
        ...(metadata ? { metadata } : {}),
      }))
      const reconciled = input.reconcile
        ? await input.reconcile(previous, input.incoming)
        : await reconcileAgentMessages(previous, input.incoming, { trigger: input.trigger })
      const claimed = await db.query(
        `insert into ${runs} (id,${sessionColumn},user_id,status) values ($1,$2,$3,'running')
        on conflict do nothing returning id`,
        [input.runId, input.sessionId, input.userId]
      )
      if (!claimed.length) {
        throw new AgentStorageError(
          'conflict',
          'This request was already attempted. Reload the session.'
        )
      }
      if (stored.runtime_active_run_id) {
        await db.query(
          `update ${runs} set status='failed',finished_at=now() where id=$1 and ${sessionColumn}=$2 and user_id=$3 and status='running'`,
          [stored.runtime_active_run_id, input.sessionId, input.userId]
        )
        await appendEvent(db, { ...input, runId: stored.runtime_active_run_id }, 'run.interrupted')
      }
      const firstRemoved = previous.find(
        (message) => !reconciled.some((next) => next.id === message.id)
      )
      if (firstRemoved) {
        await db.query(
          `delete from ${messages} where ${sessionColumn}=$1 and user_id=$3 and seq >=
          (select seq from ${messages} where ${sessionColumn}=$1 and id=$2 and user_id=$3)`,
          [input.sessionId, firstRemoved.id, input.userId]
        )
      }
      await writeMessages(db, input, reconciled)
      await db.query(
        `update ${sessions} set revision=revision+1,${activeColumn}=$3,active_since=now(),updated_at=now() where id=$1 and user_id=$2`,
        [input.sessionId, input.userId, input.runId]
      )
      await appendEvent(db, input, 'run.started')
      for (const message of reconciled) {
        for (const part of message.parts) {
          if (!isToolUIPart(part) || part.state !== 'approval-responded') continue
          const pending = previous
            .find((old) => old.id === message.id)
            ?.parts.find(
              (old) =>
                isToolUIPart(old) &&
                old.state === 'approval-requested' &&
                old.toolCallId === part.toolCallId
            )
          if (!pending) continue
          await appendEvent(db, input, 'approval.responded', {
            messageId: message.id,
            approvalId: part.approval.id,
            toolCallId: part.toolCallId,
            toolName: part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5),
            approved: part.approval.approved,
          })
        }
      }
      const { runtime_active_run_id: _active, runtime_is_active: _isActive, ...session } = stored
      await input.onClaim?.(db, session as Session)
      return { session: session as Session, messages: reconciled, revision: input.revision + 1 }
    })
  }

  async function finishRun(
    input: AgentRunScope & {
      responseMessage?: UIMessage
      status?: 'completed' | 'failed' | 'cancelled'
      onFinish?: (database: AgentDatabaseQuery) => Promise<void>
    }
  ): Promise<boolean> {
    return database.transaction(async (db) => {
      const session = await lock(db, input)
      if (session.runtime_active_run_id !== input.runId) return false
      let status: AgentRunStatus = input.status ?? (input.responseMessage ? 'completed' : 'failed')
      if (input.responseMessage) {
        await writeMessages(db, input, [input.responseMessage])
        for (const part of input.responseMessage.parts) {
          if (!isToolUIPart(part) || part.state !== 'approval-requested') continue
          if (status === 'completed') status = 'waiting_for_approval'
          await appendEvent(db, input, 'approval.requested', {
            messageId: input.responseMessage.id,
            approvalId: part.approval.id,
            toolCallId: part.toolCallId,
            toolName: part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5),
          })
        }
      }
      await input.onFinish?.(db)
      await db.query(
        `update ${runs} set status=$4,finished_at=now()
        where id=$1 and ${sessionColumn}=$2 and user_id=$3`,
        [input.runId, input.sessionId, input.userId, status]
      )
      await db.query(
        `update ${sessions} set ${activeColumn}=null,active_since=null,updated_at=now()
        where id=$1 and user_id=$2`,
        [input.sessionId, input.userId]
      )
      await appendEvent(db, input, `run.${status}`)
      return true
    })
  }

  async function executeOnce(
    input: AgentRunScope & {
      toolCallId: string
      toolName: string
      input: unknown
      execute: () => Promise<unknown>
    }
  ): Promise<unknown> {
    const claim = await database.transaction(async (db) => {
      const session = await lock(db, input)
      const [existing] = await db.query(
        `select tool_name,input,status,output from ${executions} where ${sessionColumn}=$1 and tool_call_id=$2`,
        [input.sessionId, input.toolCallId]
      )
      if (existing) {
        if (
          existing.tool_name === input.toolName &&
          isDeepStrictEqual(existing.input, input.input) &&
          existing.status === 'completed'
        ) {
          return { cached: true as const, output: existing.output }
        }
        throw new AgentStorageError(
          'conflict',
          'This operation was already attempted. Check its outcome before trying a new operation.'
        )
      }
      if (session.runtime_active_run_id !== input.runId || !session.runtime_is_active) {
        throw new AgentStorageError('conflict', 'This run is no longer active.')
      }
      await db.query(
        `insert into ${executions} (${sessionColumn},tool_call_id,tool_name,input,status)
        values ($1,$2,$3,$4,'started')`,
        [input.sessionId, input.toolCallId, input.toolName, JSON.stringify(input.input)]
      )
      await appendEvent(db, input, 'tool.started', {
        toolCallId: input.toolCallId,
        toolName: input.toolName,
      })
      return { cached: false as const }
    })
    if (claim.cached) return claim.output
    // Commit the claim before calling outside Postgres. A failed or uncertain
    // operation remains claimed permanently, including after a worker restart.
    try {
      const output = await input.execute()
      await database.transaction(async (db) => {
        await lock(db, input)
        await db.query(
          `update ${executions} set status='completed',output=$3 where ${sessionColumn}=$1 and tool_call_id=$2`,
          [input.sessionId, input.toolCallId, JSON.stringify(output ?? null)]
        )
        await appendEvent(db, input, 'tool.completed', {
          toolCallId: input.toolCallId,
          toolName: input.toolName,
        })
      })
      return output
    } catch (error) {
      try {
        await database.transaction(async (db) => {
          await lock(db, input)
          const failed = await db.query(
            `update ${executions} set status='failed' where ${sessionColumn}=$1 and tool_call_id=$2 and status='started' returning tool_call_id`,
            [input.sessionId, input.toolCallId]
          )
          if (failed.length) {
            await appendEvent(db, input, 'tool.failed', {
              toolCallId: input.toolCallId,
              toolName: input.toolName,
            })
          }
        })
      } catch {
        // The durable 'started' claim still prevents an unsafe retry if storage is unavailable.
      }
      throw error
    }
  }

  async function readEvents(input: AgentSessionScope & { after?: string; limit?: number }) {
    const after = input.after ?? '0'
    if (!/^(0|[1-9][0-9]{0,18})$/.test(after) || BigInt(after) > 9_223_372_036_854_775_807n) {
      throw new AgentStorageError('invalid_input', 'Invalid event cursor.')
    }
    const limit = positiveInteger(input.limit ?? 100, 'event limit', 500)
    const [owner] = await database.query(
      `select id from ${sessions} where id=$1 and user_id=$2 and deleted_at is null`,
      [input.sessionId, input.userId]
    )
    if (!owner) throw new AgentStorageError('not_found', 'Session not found.')
    const rows = await database.query<{
      seq: string
      run_id: string
      type: AgentRunEventType
      data: AgentRunEvent['data']
      created_at: Date | string
    }>(
      `select e.seq::text,e.run_id,e.type,e.data,e.created_at from ${events} e
      join ${sessions} s on s.id=e.${sessionColumn}
      where s.id=$1 and s.user_id=$2 and s.deleted_at is null and e.user_id=$2 and e.seq > $3::bigint
      order by e.seq limit $4`,
      [input.sessionId, input.userId, after, limit + 1]
    )
    const page: AgentRunEvent[] = rows.slice(0, limit).map((row) => ({
      cursor: row.seq,
      runId: row.run_id,
      type: row.type,
      data: row.data,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }))
    return { events: page, nextCursor: page.at(-1)?.cursor ?? after, hasMore: rows.length > limit }
  }

  return { readSession, startRun, finishRun, executeOnce, readEvents }
}

export type AgentSessionStore = ReturnType<typeof createPostgresSessionStore>
