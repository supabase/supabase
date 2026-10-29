import { z } from 'zod'

// Date ranges travel through filter bars as a single `from – to` string value.
const TIME_RANGE_SEPARATOR = ' – '

export const serializeTimeRange = (range: Date[]): string =>
  range.map((date) => date.toISOString()).join(TIME_RANGE_SEPARATOR)

export const parseTimeRange = (value: unknown): [Date, Date] | undefined => {
  if (typeof value !== 'string') return
  const result = z
    .tuple([z.coerce.date(), z.coerce.date()])
    .safeParse(value.split(TIME_RANGE_SEPARATOR))
  if (!result.success || result.data[0] > result.data[1]) return
  return result.data
}
