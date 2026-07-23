import dayjs from 'dayjs'

import { type DatabaseActivity } from '@/data/database/activity-query'

export const getDuration = (activity: DatabaseActivity) => {
  const { state } = activity
  if (state === 'active' && activity.query_start) {
    return dayjs().utc().diff(dayjs(activity.query_start).utc(), 'second')
  }
  if (state === 'idle' && activity.state_change) {
    return dayjs().utc().diff(dayjs(activity.state_change).utc(), 'second')
  }
  if (
    (state === 'idle in transaction' || state === 'idle in transaction (aborted)') &&
    activity.transaction_start
  ) {
    return dayjs().utc().diff(dayjs(activity.transaction_start).utc(), 'second')
  }
  return null
}

export const getBadgeVariant = (activity: DatabaseActivity) => {
  const { state } = activity
  if (state === 'active') return 'success'
  if (state === 'idle in transaction' || state === 'idle in transaction (aborted)') return 'warning'
  return 'default'
}
