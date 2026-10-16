import { describe, expect, it } from 'vitest'

import { getColumnType } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/DateTimeInput/DateTimeInput.utils'

describe('getColumnType', () => {
  it.each(['date', 'DATE'])('maps %s to a date input', (format) => {
    expect(getColumnType(format)).toBe('date')
  })

  it.each(['time', 'timetz', 'TIMETZ'])('maps %s to a time input', (format) => {
    expect(getColumnType(format)).toBe('time')
  })

  it.each(['timestamp', 'timestamptz', 'TIMESTAMPTZ'])(
    'maps %s to a datetime-local input',
    (format) => {
      expect(getColumnType(format)).toBe('datetime-local')
    }
  )

  it.each(['text', 'uuid', 'int8', ''])('falls back to a text input for %s', (format) => {
    expect(getColumnType(format)).toBe('text')
  })
})
