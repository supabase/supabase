import dayjs from 'dayjs'
import { isGroup, type FilterCondition, type FilterGroup } from 'ui-patterns/FilterBar'

import type { DatetimeHelper } from '@/components/interfaces/Settings/Logs/Logs.types'
import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'

export const PROJECT_FILTER_PROPERTY = 'project'
export const USER_FILTER_PROPERTY = 'user'
export const DATE_FILTER_PROPERTY = 'date'

const DEFAULT_AUDIT_LOG_RANGE_HOURS = 24

export const AUDIT_LOG_DATEPICKER_HELPERS: DatetimeHelper[] = [1, 3, 6, 12, 24].map((hours) => ({
  text: `Last ${hours} ${hours === 1 ? 'hour' : 'hours'}`,
  calcFrom: () => dayjs().subtract(hours, 'hour').toISOString(),
  calcTo: () => dayjs().toISOString(),
  default: hours === DEFAULT_AUDIT_LOG_RANGE_HOURS,
}))

export const findDateCondition = (group: FilterGroup) =>
  group.conditions.find(
    (condition): condition is FilterCondition =>
      !isGroup(condition) && condition.propertyName === DATE_FILTER_PROPERTY
  )

export const getDefaultAuditLogRange = () => {
  const now = dayjs().utc().set('millisecond', 0)
  return {
    from: now.subtract(DEFAULT_AUDIT_LOG_RANGE_HOURS, 'hour').toISOString(),
    to: now.toISOString(),
  }
}

const isConditionValueEmpty = (value: FilterCondition['value']) =>
  value === null || value === undefined || value === ''

// Evaluates the filter tree against a log. Conditions that don't narrow rows client-side (empty
// values, and the date range which the API already applies) are skipped rather than treated as
// false, so a half-typed chip doesn't blank the table.
const matchesGroup = (log: AuditLog, group: FilterGroup): boolean | null => {
  const results = group.conditions
    .map((condition) => {
      if (isGroup(condition)) return matchesGroup(log, condition)
      if (isConditionValueEmpty(condition.value)) return null
      if (condition.propertyName === PROJECT_FILTER_PROPERTY)
        return log.project_ref === condition.value
      if (condition.propertyName === USER_FILTER_PROPERTY)
        return log.actor.user_id === condition.value
      return null
    })
    .filter((result) => result !== null)
  if (results.length === 0) return null
  return group.logicalOperator === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

export function filterByFilterGroup(logs: AuditLog[], group: FilterGroup): AuditLog[] {
  return logs.filter((log) => matchesGroup(log, group) !== false)
}
