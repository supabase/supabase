import { beforeEach, describe, expect, it, vi } from 'vitest'

import { duplicateTable } from './SidePanelEditor.utils'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'

const mockExecuteSql = vi.fn()
const mockFetchQuery = vi.fn()
const mockInvalidateQueries = vi.fn()
const mockUpdateTable = vi.fn()
const mockGetTables = vi.fn()

vi.mock('@/data/query-client', () => ({
  getQueryClient: () => ({
    fetchQuery: mockFetchQuery,
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

vi.mock('@/data/tables/tables-query', () => ({
  getTables: (...args: unknown[]) => mockGetTables(...args),
}))

vi.mock('@/data/tables/table-update-mutation', () => ({
  updateTable: (...args: unknown[]) => mockUpdateTable(...args),
}))

describe('duplicateTable', () => {
  const projectRef = 'test-project-ref'
  const connectionString = 'postgresql://localhost:5432/test'

  const sourceTable: RetrieveTableResult = {
    id: 123,
    name: 'source_table',
    schema: 'public',
    comment: null,
    columns: [
      {
        id: '123.1',
        name: 'id',
        identity_generation: 'BY DEFAULT',
      },
      {
        id: '123.2',
        name: 'serial_col',
        identity_generation: 'ALWAYS',
      },
    ],
    primary_keys: [],
    relationships: [],
  } as RetrieveTableResult

  const duplicatedTable: RetrieveTableResult = {
    ...sourceTable,
    id: 456,
    name: 'duplicated_table',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockExecuteSql.mockResolvedValue({ result: [] })
    mockInvalidateQueries.mockResolvedValue(undefined)
    mockUpdateTable.mockResolvedValue(undefined)
    mockGetTables.mockResolvedValue([duplicatedTable])
    mockFetchQuery.mockImplementation(({ queryFn }) => {
      if (queryFn) {
        return queryFn({ signal: new AbortController().signal })
      }
      return Promise.resolve([duplicatedTable])
    })
  })

  it('awaits batched identity sequence updates before fetching the duplicated table', async () => {
    const callOrder: string[] = []

    mockExecuteSql.mockImplementation(async (args: { queryKey?: string[] }) => {
      if (args.queryKey?.[0] === 'sequences') {
        callOrder.push('identity-sequences')
      } else {
        callOrder.push('execute-sql')
      }
      return { result: [] }
    })

    mockFetchQuery.mockImplementation(async ({ queryFn }) => {
      callOrder.push('fetch-query')
      if (queryFn) {
        return queryFn({ signal: new AbortController().signal })
      }
      return [duplicatedTable]
    })

    const result = await duplicateTable(
      projectRef,
      connectionString,
      { name: 'duplicated_table' },
      {
        duplicateTable: sourceTable,
        isRLSEnabled: false,
        isDuplicateRows: true,
        foreignKeyRelations: [],
      }
    )

    expect(result).toStrictEqual(duplicatedTable)
    expect(callOrder).toEqual(['execute-sql', 'execute-sql', 'identity-sequences', 'fetch-query'])

    const sequenceCall = mockExecuteSql.mock.calls.find(
      ([args]) => args.queryKey?.[0] === 'sequences' && args.queryKey?.[1] === 'duplicate-batch'
    )
    expect(sequenceCall).toBeDefined()

    const sequenceSql = String(sequenceCall?.[0].sql)
    expect(sequenceSql).toContain('id')
    expect(sequenceSql).toContain('serial_col')
    expect(mockExecuteSql).toHaveBeenCalledTimes(3)
  })

  it('does not run identity sequence updates when duplicating structure only', async () => {
    await duplicateTable(
      projectRef,
      connectionString,
      { name: 'duplicated_table' },
      {
        duplicateTable: sourceTable,
        isRLSEnabled: false,
        isDuplicateRows: false,
        foreignKeyRelations: [],
      }
    )

    expect(mockExecuteSql).toHaveBeenCalledTimes(1)
    expect(mockExecuteSql.mock.calls.some(([args]) => args.queryKey?.[0] === 'sequences')).toBe(
      false
    )
  })
})
