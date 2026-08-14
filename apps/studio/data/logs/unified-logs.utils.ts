import { tryParseJson } from '@/lib/helpers'

const extractLeadingStatus = (s?: string) => {
  const m = typeof s === 'string' ? s.match(/^(\d{3})\b/) : null
  return m ? Number(m[1]) : undefined
}

// [Joshen] Row has an unknown type in this case so `any` is accurate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractLogMetadata = (row: any) => {
  // [Joshen] For auth logs, these metadata are nested within event_message,
  // so opting to bring them out at the query level
  const eventMessage = tryParseJson(row.event_message)
  const status =
    row.log_type === 'auth'
      ? (eventMessage?.status ??
        extractLeadingStatus(eventMessage?.msg) ??
        extractLeadingStatus(eventMessage?.error))
      : (row.status ?? 200)
  const method = row.log_type === 'auth' ? eventMessage?.method : row.method
  const pathname =
    row.log_type === 'auth'
      ? eventMessage?.path
      : (row.url || '').replace(/^https?:\/\/[^\/]+/, '') || row.pathname || ''

  return { status, method, pathname }
}
