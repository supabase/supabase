// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { insertRowsViaSpreadsheet } from './SidePanelEditor.utils'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'

const mockExecuteSql = vi.fn()

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

vi.mock('@/components/ui/SparkBar', () => ({
  default: () => null,
}))

const table = {
  id: 1,
  name: 'routes',
  schema: 'public',
  columns: [
    { id: '1.1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
    { id: '1.2', name: 'path', data_type: 'text', format: 'text', is_nullable: true },
  ],
} as unknown as RetrieveTableResult

const importCsv = (csv: string) =>
  insertRowsViaSpreadsheet({
    projectRef: 'test-project-ref',
    connectionString: 'postgresql://localhost:5432/test',
    file: new File([csv], 'routes.csv', { type: 'text/csv' }),
    table,
    selectedHeaders: ['id', 'path'],
    onProgressUpdate: vi.fn(),
  })

describe('insertRowsViaSpreadsheet', () => {
  beforeEach(() => {
    mockExecuteSql.mockReset()
    mockExecuteSql.mockResolvedValue({ result: [] })
  })

  it('imports rows that are larger than a single parse chunk', async () => {
    // Larger than the 0.1MB chunk the file is read in, like a long LineString
    const largeValue = 'x'.repeat(300 * 1024)
    const csv = `id,path\n1,small\n2,${largeValue}\n3,small\n`

    const { error } = await importCsv(csv)

    expect(error).toBeUndefined()
    const insertedSql = mockExecuteSql.mock.calls.map(([args]) => args.sql).join('\n')
    expect(insertedSql).toContain('"id":"1"')
    expect(insertedSql).toContain(largeValue)
    expect(insertedSql).toContain('"id":"3"')
  })

  it('returns the error when an insert fails', async () => {
    mockExecuteSql.mockRejectedValue(new Error('insert failed'))

    const { error } = await importCsv('id,path\n1,small\n')

    expect(error).toEqual(new Error('insert failed'))
  })
})
