import { HttpError } from '../http/errors'
import { adminQuery, adminTransaction } from './postgres'
import {
  AgentStorageError,
  createPostgresSessionStore,
  type AgentDatabase,
} from './postgres-session-store'

const database: AgentDatabase = {
  query: adminQuery,
  transaction: (work) =>
    adminTransaction((client) =>
      work({
        query: async (sql, values) => (await client.query(sql, values)).rows,
      })
    ),
}

export const assistantSessionStore = createPostgresSessionStore({
  database,
  tables: {
    sessions: { schema: 'public', name: 'conversations' },
    messages: { schema: 'public', name: 'messages' },
    runs: { schema: 'private', name: 'conversation_runs' },
    executions: { schema: 'private', name: 'tool_executions' },
    events: { schema: 'private', name: 'run_events' },
  },
  columns: { sessionId: 'conversation_id', activeRunId: 'active_request_id' },
})

export async function withSessionStoreErrors<Result>(work: () => Promise<Result>): Promise<Result> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof AgentStorageError) {
      const status = error.code === 'not_found' ? 404 : error.code === 'invalid_input' ? 400 : 409
      const code = error.code === 'invalid_input' ? 'invalid_request' : error.code
      throw new HttpError(status, code, error.message)
    }
    throw error
  }
}

export function readRunEvents(
  userId: string,
  sessionId: string,
  options: { after?: string; limit?: number } = {}
) {
  return withSessionStoreErrors(() =>
    assistantSessionStore.readEvents({ userId, sessionId, ...options })
  )
}
