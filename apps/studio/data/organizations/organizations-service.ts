import type { Organization } from '@/types'

export interface OrganizationsService {
  getOrganizations: (params: { signal?: AbortSignal }) => Promise<Organization[]>
}
