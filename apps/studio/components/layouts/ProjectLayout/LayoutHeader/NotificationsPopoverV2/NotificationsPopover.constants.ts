export type NOTIFICATION_FILTER_TYPE = 'all' | 'unread' | 'warning' | 'critical'

export const NOTIFICATION_FILTERS: {
  id: NOTIFICATION_FILTER_TYPE
  label: string
}[] = [
  { id: 'all', label: 'View all notifications' },
  { id: 'unread', label: 'View unread notifications' },
  { id: 'warning', label: 'View warning notifications' },
  { id: 'critical', label: 'View critical notifications' },
]
