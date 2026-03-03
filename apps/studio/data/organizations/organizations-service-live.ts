import { getOrganizations } from './organizations-query'
import type { OrganizationsService } from './organizations-service'

export const organizationsServiceLive: OrganizationsService = {
  getOrganizations,
}
