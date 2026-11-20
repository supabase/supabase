import { beforeEach, expect, test, vi } from 'vitest'

import { getDatabaseQueue } from './database-queue-messages-infinite-query'

const mockExecuteSql = vi.fn()

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

beforeEach(() => {
  mockExecuteSql.mockReset()
  mockExecuteSql.mockResolvedValue({ result: [] })
})

const capturedSql = () => String(mockExecuteSql.mock.calls[0][0].sql)

test('next pages use a composite (enqueued_at, msg_id) cursor, not enqueued_at alone', async () => {
  await getDatabaseQueue({
    projectRef: 'ref',
    connectionString: null,
    queueName: 'my_queue',
    status: ['available'],
    after: { enqueuedAt: '2024-01-01T00:00:00.000Z', msgId: 42 },
  })

  const sql = capturedSql()
  expect(sql).toContain('(enqueued_at, msg_id) > (')
  expect(sql).toContain('order by enqueued_at, msg_id')
  // The old single-column cursor (`WHERE enqueued_at > ...`) skipped rows sharing
  // the last page's timestamp, dropping messages from the list.
  expect(sql).not.toMatch(/WHERE enqueued_at >\s/)
})

test('first page omits the cursor predicate but still orders by the unique key', async () => {
  await getDatabaseQueue({
    projectRef: 'ref',
    connectionString: null,
    queueName: 'my_queue',
    status: ['available'],
    after: undefined,
  })

  const sql = capturedSql()
  expect(sql).not.toContain('(enqueued_at, msg_id) >')
  expect(sql).toContain('order by enqueued_at, msg_id')
})
