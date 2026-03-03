import { getPermissions } from './permissions-query'
import type { PermissionsService } from './permissions-service'

export const permissionsServiceLive: PermissionsService = {
  getPermissions,
}
