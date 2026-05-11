import { copyToClipboard } from 'ui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  formatFilterURLParams,
  formatSortURLParams,
  handleCellKeyDown,
} from '@/components/grid/SupabaseGrid.utils'

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

// Sort URL syntax: `column:order`
describe('SupabaseGrid.utils: formatSortURLParams', () => {
  test('should return an array of sort options based on URL params', () => {
    const mockInput = ['id:asc', 'name:desc']
    const output = formatSortURLParams('fakeTable', mockInput)
    expect(output).toStrictEqual([
      { table: 'fakeTable', column: 'id', ascending: true },
      { table: 'fakeTable', column: 'name', ascending: false },
    ])
  })
  test('should reject any malformed sort options based on URL params', () => {
    const mockInput = ['id', 'name:asc', ':asc']
    const output = formatSortURLParams('fakeTable', mockInput)
    expect(output).toStrictEqual([
      {
        table: 'fakeTable',
        column: 'name',
        ascending: true,
      },
    ])
  })
})

// Filter URL syntax: `column:operatorAbbreviation:value`
describe('SupabaseGrid.utils: formatFilterURLParams', () => {
  test('should return an array of filter options based on URL params', () => {
    const mockInput = ['id:gte:20', 'id:lte:40']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(2)
    expect(output[0]).toStrictEqual({
      column: 'id',
      operator: '>=',
      value: '20',
    })
    expect(output[1]).toStrictEqual({
      column: 'id',
      operator: '<=',
      value: '40',
    })
  })
  test('should format filters for timestamps correctly', () => {
    const mockInput = ['created_at:gte:2022-05-30 03:00:00']
    const output = formatFilterURLParams(mockInput)
    expect(output[0]).toStrictEqual({
      column: 'created_at',
      operator: '>=',
      value: '2022-05-30 03:00:00',
    })
  })
  test('should reject any malformed filter options based on URL params', () => {
    const mockInput = ['id', ':gte', ':50', 'id:eq:10']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(1)
  })
  test('should reject any filter options with unrecognized operator', () => {
    const mockInput = ['id:meme:40', 'name:eq:town']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(1)
  })
  test('should allow filter options to have empty value based on URL params', () => {
    const mockInput = ['id:ilike:']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(1)
    expect(output[0]).toStrictEqual({
      column: 'id',
      operator: '~~*',
      value: '',
    })
  })
})

describe('SupabaseGrid.utils: handleCellKeyDown', () => {
  beforeEach(() => {
    toastError.mockReset()
    toastSuccess.mockReset()
    vi.unstubAllGlobals()
    vi.spyOn(window.document, 'hasFocus').mockReturnValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('should copy the selected cell value when Meta+C is pressed', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText },
    })

    const args = {
      mode: 'SELECT',
      column: { key: 'name' },
      row: { name: 'hello from safari' },
      rowIdx: 0,
      selectCell: vi.fn(),
    } as unknown as Parameters<typeof handleCellKeyDown>[0]

    const event = {
      key: 'C',
      metaKey: true,
      ctrlKey: false,
      altKey: false,
      nativeEvent: new KeyboardEvent('keydown', { key: 'C', metaKey: true }),
      preventDefault: vi.fn(),
      preventGridDefault: vi.fn(),
    } as unknown as Parameters<typeof handleCellKeyDown>[1]

    handleCellKeyDown(args, event)

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('hello from safari')
    })
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.preventGridDefault).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Copied cell value to clipboard')
    })
  })
})

describe('shared clipboard util', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.spyOn(window.document, 'hasFocus').mockReturnValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('should invoke the callback after writing text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const onCopy = vi.fn()

    vi.stubGlobal('navigator', {
      clipboard: { writeText },
    })

    await copyToClipboard('hello from safari', onCopy)
    expect(writeText).toHaveBeenCalledWith('hello from safari')
    expect(onCopy).toHaveBeenCalled()
  })
})
