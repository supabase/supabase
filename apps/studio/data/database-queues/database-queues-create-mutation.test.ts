import { beforeEach, expect, test, vi } from 'vitest'

import { createDatabaseQueue } from './database-queues-create-mutation'

const mockExecuteSql = vi.fn()

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

beforeEach(() => {
  mockExecuteSql.mockReset()
  mockExecuteSql.mockResolvedValue({ result: [] })
})

const capturedSql = () => String(mockExecuteSql.mock.calls[0][0].sql)

test('partitioned queues pass the intervals as text literals', async () => {
  await createDatabaseQueue({
    projectRef: 'ref',
    name: 'q',
    type: 'partitioned',
    enableRls: false,
    configuration: { partitionInterval: 10000, retentionInterval: 100000 },
  })

  expect(capturedSql()).toContain(
    "pgmq.create_partitioned('q', partition_interval => '10000', retention_interval => '100000')"
  )
})

test('partitioned queues keep a single supplied interval', async () => {
  await createDatabaseQueue({
    projectRef: 'ref',
    name: 'q',
    type: 'partitioned',
    enableRls: false,
    configuration: { retentionInterval: 100000 },
  })

  expect(capturedSql()).toContain("pgmq.create_partitioned('q', retention_interval => '100000')")
})

test('partitioned queues without intervals use the function defaults', async () => {
  await createDatabaseQueue({
    projectRef: 'ref',
    name: 'q',
    type: 'partitioned',
    enableRls: false,
  })

  expect(capturedSql()).toContain("pgmq.create_partitioned('q')")
})

test('basic queues use pgmq.create', async () => {
  await createDatabaseQueue({ projectRef: 'ref', name: 'q', type: 'basic', enableRls: false })

  expect(capturedSql()).toContain("pgmq.create('q')")
})

test('unlogged queues use pgmq.create_unlogged', async () => {
  await createDatabaseQueue({ projectRef: 'ref', name: 'q', type: 'unlogged', enableRls: false })

  expect(capturedSql()).toContain("pgmq.create_unlogged('q')")
})
