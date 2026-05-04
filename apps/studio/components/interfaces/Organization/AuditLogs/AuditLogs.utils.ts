import dayjs from 'dayjs'

import { DatePickerToFrom } from '@/components/interfaces/Settings/Logs/Logs.types'
import type { V2AuditLog } from '@/data/organizations/organization-audit-logs-query'

export function sortAuditLogs(logs: V2AuditLog[], descending: boolean): V2AuditLog[] {
  return [...logs].sort((a, b) =>
    descending ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  )
}

export function filterByUsers(logs: V2AuditLog[], userIds: string[]): V2AuditLog[] {
  if (userIds.length === 0) return logs
  return logs.filter((log) => userIds.includes(log.actor.user_id ?? ''))
}

export function filterByProjects(logs: V2AuditLog[], projectRefs: string[]): V2AuditLog[] {
  if (projectRefs.length === 0) return logs
  return logs.filter((log) => projectRefs.includes(log.project_ref ?? ''))
}

// [Joshen] Mainly to handle if a single date is selected - currently just for Audit Logs as
// i'm on the fence if this logic should be within the DatePicker component itself
// e.g for Logs.DatePicker which uses this component, the component itself has its own time selection UI
// JFYI currentDate is just a parameter so that I can run tests for this

export const formatSelectedDateRange = (value: DatePickerToFrom) => {
  const current = dayjs()
  const from = dayjs(value.from)
    .hour(current.hour())
    .minute(current.minute())
    .second(current.second())
  const to = dayjs(value.to).hour(current.hour()).minute(current.minute()).second(current.second())

  if (from.date() === to.date()) {
    // [Joshen] If a single date is selected, we either set the "from" to start from 00:00
    // or "to" to end at 23:59 depending on which date was selected
    if (from.date() === current.date()) {
      return {
        from: from.set('hour', 0).set('minute', 0).set('second', 0).utc().toISOString(),
        to: to.utc().toISOString(),
      }
    } else {
      return {
        from: from.utc().toISOString(),
        to: to.set('hour', 23).set('minute', 59).set('second', 59).utc().toISOString(),
      }
    }
  } else {
    return { from: from.utc().toISOString(), to: to.utc().toISOString() }
  }
}
