import type { ProjectServiceStatus as APIProjectServiceStatus } from '@/data/service-status/service-status-query'

export type ProjectServiceStatus = APIProjectServiceStatus | 'DISABLED'
