import type { ProjectServiceStatus as APIProjectServiceStatus } from '@/data/service-status/service-status-query'

export type ProjectServiceStatus = APIProjectServiceStatus | 'DISABLED'

export const resolveRealtimeServiceStatus = (
  isHighAvailability: boolean,
  status?: APIProjectServiceStatus
): ProjectServiceStatus => {
  return isHighAvailability ? 'DISABLED' : (status ?? 'UNHEALTHY')
}
