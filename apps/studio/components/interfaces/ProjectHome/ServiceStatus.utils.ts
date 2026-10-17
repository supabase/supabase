import type { ProjectServiceStatus as APIProjectServiceStatus } from '@/data/service-status/service-status-query'

export type ProjectServiceStatus = APIProjectServiceStatus | 'DISABLED'

export const resolveRealtimeServiceStatus = (
  isRealtimeUnavailable: boolean,
  status?: APIProjectServiceStatus
): ProjectServiceStatus => {
  return isRealtimeUnavailable ? 'DISABLED' : (status ?? 'UNHEALTHY')
}
