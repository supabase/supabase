import dayjs from 'dayjs'

import type { DatetimeHelper } from './Logs.types'

/**
 * Framework-free date-range helpers shared by the Logs date picker
 * (`Logs.DatePickers.tsx`) and the SQL editor's logs query-source domain
 * (`SQLEditor/querySource.ts`). Kept in a pure `.ts` module — depending only on
 * dayjs — so both a React component and a valtio-free domain module can import it
 * without pulling in the picker's UI.
 */

/** The relative-range units the picker and the logs domain both speak. */
export type Unit = 'minute' | 'hour' | 'day' | 'week'

export type ParsedCustomInput =
  | { type: 'number'; value: number }
  | { type: 'unit'; value: number; unit: Unit }
  | { type: 'invalid' }

export const parseCustomInput = (input: string): ParsedCustomInput => {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return { type: 'invalid' }

  // Try to match "number + optional space + unit prefix"
  const match = trimmed.match(/^(\d+)\s*([a-z]*)$/)
  if (!match) return { type: 'invalid' }

  const [, numStr, unitStr] = match
  const value = Number.parseInt(numStr, 10)

  // Only finite positive values may reach generateDynamicHelper(): Number.isFinite
  // rejects NaN and Infinity outright, and the <= 0 guard keeps out non-positive.
  if (!Number.isFinite(value) || value <= 0) return { type: 'invalid' }

  if (!unitStr) {
    return { type: 'number', value }
  }

  // Match if unitStr is a prefix of any unit name or its first letter
  const units: Unit[] = ['minute', 'hour', 'day', 'week']
  const matchedUnit = units.find((u) => u.startsWith(unitStr) || u[0] === unitStr)

  if (!matchedUnit) return { type: 'invalid' }

  return { type: 'unit', value, unit: matchedUnit }
}

export const generateDynamicHelper = (value: number, unit: Unit): DatetimeHelper => {
  return {
    text: `Last ${value} ${unit}${value === 1 ? '' : 's'}`,
    calcFrom: () => dayjs().subtract(value, unit).toISOString(),
    calcTo: () => dayjs().toISOString(),
  }
}

export const generateDynamicHelpers = (value: number): DatetimeHelper[] => {
  const units: Unit[] = ['minute', 'hour', 'day', 'week']
  return units.map((unit) => generateDynamicHelper(value, unit))
}

export const generateHelpersFromInput = (input: string): DatetimeHelper[] | null => {
  const parsed = parseCustomInput(input)

  switch (parsed.type) {
    case 'number':
      return generateDynamicHelpers(parsed.value)
    case 'unit':
      return [generateDynamicHelper(parsed.value, parsed.unit)]
    case 'invalid':
      return null
  }
}
