import { describe, expect, it, vi } from 'vitest'

import { createPostgresSessionStore, type AgentDatabase } from './postgres-session-store'

function database() {
  return { query: vi.fn(), transaction: vi.fn() } satisfies AgentDatabase
}

describe('storage input boundaries', () => {
  it('rejects dynamic SQL fragments in the configurable table and column identifiers', () => {
    const db = database()
    for (const name of ['runs; drop table users', 'runs"', 'public.runs', '']) {
      expect(() =>
        createPostgresSessionStore({ database: db, tables: { runs: { schema: 'private', name } } })
      ).toThrow('Invalid storage identifier')
      expect(() =>
        createPostgresSessionStore({ database: db, columns: { sessionId: name } })
      ).toThrow('Invalid storage identifier')
    }
    expect(db.query).not.toHaveBeenCalled()
  })

  it('rejects overflowing or unsafe event cursors before making a database query', async () => {
    const db = database()
    const store = createPostgresSessionStore({ database: db })
    for (const after of ['-1', '1;select 1', '9223372036854775808', '1.2']) {
      await expect(
        store.readEvents({ sessionId: 'session', userId: 'user', after })
      ).rejects.toMatchObject({ code: 'invalid_input' })
    }
    expect(db.query).not.toHaveBeenCalled()
  })

  it('preserves bigint cursors without converting them to imprecise JavaScript numbers', async () => {
    const db = database()
    db.query.mockResolvedValueOnce([{ id: 'session' }]).mockResolvedValueOnce([
      {
        seq: '9007199254740993',
        run_id: 'run',
        type: 'run.started',
        data: {},
        created_at: new Date('2026-01-01T00:00:00Z'),
      },
    ])
    const store = createPostgresSessionStore({ database: db })
    const page = await store.readEvents({
      sessionId: 'session',
      userId: 'owner',
      after: '9007199254740992',
    })
    expect(page.nextCursor).toBe('9007199254740993')
    expect(page.events[0].cursor).toBe('9007199254740993')
    expect(db.query.mock.calls[1][1]).toEqual(['session', 'owner', '9007199254740992', 101])
  })

  it('never performs an external operation when its durable claim cannot commit', async () => {
    const db = database()
    db.transaction.mockRejectedValue(new Error('Commit failed'))
    const execute = vi.fn()
    const store = createPostgresSessionStore({ database: db })
    await expect(
      store.executeOnce({
        sessionId: 'session',
        userId: 'owner',
        runId: 'run',
        toolCallId: 'call',
        toolName: 'write',
        input: {},
        execute,
      })
    ).rejects.toThrow('Commit failed')
    expect(execute).not.toHaveBeenCalled()
  })
})
