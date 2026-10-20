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
export type Unit = 'second' | 'minute' | 'hour' | 'day'

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

  const exceedsDateRange = !dayjs().subtract(value, 'day').isValid()
  if (!Number.isFinite(value) || value <= 0 || exceedsDateRange) return { type: 'invalid' }

  if (!unitStr) {
    return { type: 'number', value }
  }

  // Match if unitStr is a prefix of any unit name or its first letter
  const units: Unit[] = ['second', 'minute', 'hour', 'day']
  const matchedUnit = units.find((u) => u.startsWith(unitStr) || u[0] === unitStr)

  if (!matchedUnit) return { type: 'invalid' }

  return { type: 'unit', value, unit: matchedUnit }
}

export const generateDynamicHelper = (value: number, unit: Unit): DatetimeHelper => {
  return {
    text: `Last ${value} ${unit}${value === 1 ? '' : 's'}`,
    calcFrom: (to) => dayjs(to).subtract(value, unit).toISOString(),
    calcTo: () => dayjs().toISOString(),
  }
}

export const generateDynamicHelpers = (value: number): DatetimeHelper[] => {
  const units: Unit[] = ['second', 'minute', 'hour', 'day']
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

export const formatDateRange = (from: string, to: string): string => {
  const start = dayjs(from)
  const end = dayjs(to || new Date())
  const showSeconds = end.diff(start) < 60_000 || start.second() !== 0 || end.second() !== 0
  const format = showSeconds ? 'DD MMM, HH:mm:ss' : 'DD MMM, HH:mm'
  return `${start.format(format)} - ${end.format(format)}`
}

export const formatRelativeDuration = (seconds: number): string => {
  const units = { day: 86400, hour: 3600, minute: 60, second: 1 }
  const [unit, scale] =
    Object.entries(units).find(([, scale]) => seconds >= scale && seconds % scale === 0) ??
    (['second', 1] as const)
  const value = seconds / scale
  return `Last ${value} ${unit}${value === 1 ? '' : 's'}`
}

export const findMatchingDateHelper = (
  from: Date,
  to: Date,
  helpers: DatetimeHelper[]
): DatetimeHelper | undefined =>
  helpers.find((helper) => {
    const tolerance = 60_000
    const helperEnd = new Date(helper.calcTo()).getTime()
    const helperStart = new Date(helper.calcFrom(new Date(helperEnd).toISOString())).getTime()
    const durationMatches = Math.abs(to.getTime() - from.getTime() - (helperEnd - helperStart)) <= 1
    return (
      durationMatches &&
      Math.abs(from.getTime() - helperStart) < tolerance &&
      Math.abs(to.getTime() - helperEnd) < tolerance
    )
  })
