import { describe, expect, test } from 'vitest'

import { parseSpreadsheet } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SpreadsheetImport/SpreadsheetImport.utils'

// parseSpreadsheet reads a file in 0.25MB chunks, so these files are made large enough to
// span several chunks. Each row is about 100 bytes, so the first chunk ends near row 2,600.
const makeCsvFile = (value: (row: number) => string) => {
  const note = 'x'.repeat(90)
  const rows = Array.from({ length: 6000 }, (_, row) => `${row},${value(row)},${note}`)
  return new File([['id,value,note', ...rows].join('\n')], 'data.csv', { type: 'text/csv' })
}

const parseInChunks = async (file: File) => {
  let chunkCount = 0
  const result = await parseSpreadsheet(file, () => (chunkCount += 1), undefined)
  expect(chunkCount).toBeGreaterThan(1)
  return result
}

describe('SpreadsheetImport.utils: parseSpreadsheet', () => {
  test('should keep a numeric type when a chunk starts with an empty cell', async () => {
    const file = makeCsvFile((row) => (row >= 2400 && row < 2900 ? '' : String(row)))
    const { columnTypeMap } = await parseInChunks(file)
    expect(columnTypeMap.value).toBe('int8')
  })

  test('should use float8 when one chunk has only integers and another has decimals', async () => {
    const file = makeCsvFile((row) => (row < 3000 ? String(row) : `${row}.5`))
    const { columnTypeMap } = await parseInChunks(file)
    expect(columnTypeMap.value).toBe('float8')
  })

  test('should default a column with no values in any chunk to text', async () => {
    const file = makeCsvFile(() => '')
    const { columnTypeMap } = await parseInChunks(file)
    expect(columnTypeMap.value).toBe('text')
  })
})
