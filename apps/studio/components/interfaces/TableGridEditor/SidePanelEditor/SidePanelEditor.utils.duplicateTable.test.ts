import { beforeEach, describe, expect, it, vi } from 'vitest'

import { duplicateTable } from './SidePanelEditor.utils'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'

// Define mock functions at module level
const mockExecuteSql = vi.fn()
const mockFetchQuery = vi.fn()
const mockInvalidateQueries = vi.fn()

// Setup mocks before imports
vi.mock('@/data/query-client', () => ({
  getQueryClient: () => ({
    fetchQuery: mockFetchQuery,
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

const sourceTable = {
  id: 1,
  name: 'orders',
  schema: 'public',
  comment: null,
  columns: [
    { name: 'id', identity_generation: 'BY DEFAULT' },
    { name: 'note', identity_generation: null },
  ],
} as unknown as RetrieveTableResult

const duplicatedTable = { id: 2, name: 'orders_duplicate', schema: 'public' }

const isSequenceUpdateSql = (sql: string) => sql.includes('setval')

describe('duplicateTable', () => {
  const projectRef = 'test-project-ref'
  const connectionString = 'postgresql://localhost:5432/test'

  const baseMetadata = {
    duplicateTable: sourceTable,
    isRLSEnabled: false,
    isDuplicateRows: true,
    foreignKeyRelations: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteSql.mockResolvedValue({ result: [] })
    mockInvalidateQueries.mockResolvedValue(undefined)
    mockFetchQuery.mockResolvedValue([duplicatedTable])
  })

  it('waits for identity sequence updates to finish before resolving', async () => {
    let isSequenceUpdateDone = false
    mockExecuteSql.mockImplementation(({ sql }: { sql: string }) => {
      if (isSequenceUpdateSql(sql)) {
        return new Promise((resolve) => {
          setTimeout(() => {
            isSequenceUpdateDone = true
            resolve({ result: [] })
          }, 10)
        })
      }
      return Promise.resolve({ result: [] })
    })

    const result = await duplicateTable(
      projectRef,
      connectionString,
      { name: 'orders_duplicate' },
      baseMetadata
    )

    expect(isSequenceUpdateDone).toBe(true)
    expect(result).toStrictEqual(duplicatedTable)
  })

  it('runs one sequence update per identity column', async () => {
    await duplicateTable(projectRef, connectionString, { name: 'orders_duplicate' }, baseMetadata)

    const sequenceUpdateCalls = mockExecuteSql.mock.calls.filter(([{ sql }]) =>
      isSequenceUpdateSql(sql)
    )
    expect(sequenceUpdateCalls).toHaveLength(1)
    expect(sequenceUpdateCalls[0][0].sql).toContain('orders_duplicate_id_seq')
  })

  it('rejects when an identity sequence update fails', async () => {
    mockExecuteSql.mockImplementation(({ sql }: { sql: string }) => {
      if (isSequenceUpdateSql(sql)) {
        return Promise.reject(new Error('sequence update failed'))
      }
      return Promise.resolve({ result: [] })
    })

    await expect(
      duplicateTable(projectRef, connectionString, { name: 'orders_duplicate' }, baseMetadata)
    ).rejects.toThrow('sequence update failed')
  })

  it('skips sequence updates when rows are not duplicated', async () => {
    await duplicateTable(
      projectRef,
      connectionString,
      { name: 'orders_duplicate' },
      { ...baseMetadata, isDuplicateRows: false }
    )

    const sequenceUpdateCalls = mockExecuteSql.mock.calls.filter(([{ sql }]) =>
      isSequenceUpdateSql(sql)
    )
    expect(sequenceUpdateCalls).toHaveLength(0)
  })
})
