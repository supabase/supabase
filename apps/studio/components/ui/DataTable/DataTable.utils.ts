import { FilterFn } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'

import { LEVELS } from './DataTable.constants'

export function formatCompactNumber(value: number) {
  if (value >= 100 && value < 1000) {
    return value.toString() // Keep the number as is if it's in the hundreds
  } else if (value >= 1000 && value < 1000000) {
    return (value / 1000).toFixed(1) + 'k' // Convert to 'k' for thousands
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M' // Convert to 'M' for millions
  } else {
    return value.toString() // Optionally handle numbers less than 100 if needed
  }
}

export function isArrayOfNumbers(arr: any): arr is number[] {
  if (!Array.isArray(arr)) return false
  return arr.every((item) => typeof item === 'number')
}

export function isArrayOfDates(arr: any): arr is Date[] {
  if (!Array.isArray(arr)) return false
  return arr.every((item) => item instanceof Date)
}

export function isArrayOfStrings(arr: any): arr is string[] {
  if (!Array.isArray(arr)) return false
  return arr.every((item) => typeof item === 'string')
}

export function isArrayOfBooleans(arr: any): arr is boolean[] {
  if (!Array.isArray(arr)) return false
  return arr.every((item) => typeof item === 'boolean')
}

export const inDateRange: FilterFn<any> = (row, columnId, value) => {
  const date = new Date(row.getValue(columnId))
  const [start, end] = value as Date[]

  if (isNaN(date.getTime())) return false

  // if no end date, check if it's the same day
  if (!end) return isSameDay(date, start)

  return isAfter(date, start) && isBefore(date, end)
}

inDateRange.autoRemove = (val: any) => !Array.isArray(val) || !val.length || !isArrayOfDates(val)

export const arrSome: FilterFn<any> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue)) return false
  return filterValue.some((val) => row.getValue<unknown[]>(columnId) === val)
}

arrSome.autoRemove = (val: any) => !Array.isArray(val) || !val?.length

export function getLevelColor(
  value: (typeof LEVELS)[number]
): Record<'text' | 'bg' | 'border', string> {
  switch (value) {
    case 'success':
      return {
        text: 'text-muted',
        bg: 'bg-muted',
        border: 'border-muted',
      }
    case 'warning':
      return {
        text: 'text-warning',
        bg: 'bg-warning',
        border: 'border-warning',
      }
    case 'error':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive',
        border: 'border-destructive',
      }
    default:
      return {
        text: 'text-info',
        bg: 'bg-info',
        border: 'border-info',
      }
  }
}

export function getStatusColor(value?: number | string): Record<'text' | 'bg' | 'border', string> {
  switch (value) {
    case '1':
    case 'info':
      return {
        text: 'text-blue-500',
        bg: '',
        border: 'border-blue-200 dark:border-blue-800',
      }
    case '2':
    case 'success':
      return {
        text: 'text-foreground-lighter',
        bg: '',
        border: 'border-green-200 dark:border-green-800',
      }
    case '4':
    case 'warning':
    case 'redirect':
      return {
        text: 'text-warning',
        bg: 'bg-warning-300 dark:bg-warning-200',
        border: 'border border-warning-400/50 dark:border-warning-400/50',
      }
    case '5':
    case 'error':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive-300 dark:bg-destructive-300/50',
        border: 'border border-destructive-400/50 dark:border-destructive-400/50',
      }
    default:
      return {
        text: 'text-foreground-lighter',
        bg: '',
        border: '',
      }
  }
}
