import { FilterFn } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'

import { LEVELS } from './DataTable.constants'

export function formatCompactNumber(value: number): string {
  const units = ['', 'k', 'M', 'B', 'T'];

  let unitIndex = 0;
  let num = value;

  while (num >= 999.95 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }

  return unitIndex === 0
    ? value.toString()
    : `${num.toFixed(1)}${units[unitIndex]}`;
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
        bg: 'bg-muted group-data-[state=selected]/row:bg-foreground-lighter',
        border: 'border-muted group-data-[state=selected]/row:border-foreground-lighter',
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
