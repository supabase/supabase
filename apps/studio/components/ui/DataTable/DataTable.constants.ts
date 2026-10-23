import { addDays, addHours, endOfDay, startOfDay } from 'date-fns'

import { DatePreset } from './DataTable.types'

export const ARRAY_DELIMITER = ','
export const SLIDER_DELIMITER = '-'
export const SPACE_DELIMITER = '_'
export const RANGE_DELIMITER = '-'
export const SORT_DELIMITER = '.'

export const LEVELS = ['success', 'warning', 'error'] as const

export const presets = [
  {
    label: 'Today',
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
    shortcut: 'd', // day
  },
  {
    label: 'Yesterday',
    from: startOfDay(addDays(new Date(), -1)),
    to: endOfDay(addDays(new Date(), -1)),
    shortcut: 'y',
  },
  {
    label: 'Last hour',
    from: addHours(new Date(), -1),
    to: new Date(),
    shortcut: 'h',
  },
  {
    label: 'Last 7 days',
    from: startOfDay(addDays(new Date(), -7)),
    to: endOfDay(new Date()),
    shortcut: 'w',
  },
  {
    label: 'Last 14 days',
    from: startOfDay(addDays(new Date(), -14)),
    to: endOfDay(new Date()),
    shortcut: 'b', // bi-weekly
  },
  {
    label: 'Last 30 days',
    from: startOfDay(addDays(new Date(), -30)),
    to: endOfDay(new Date()),
    shortcut: 'm',
  },
] satisfies DatePreset[]
