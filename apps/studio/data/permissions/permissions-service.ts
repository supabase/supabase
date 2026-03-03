import type { Permission } from 'types'

export type PermissionsResponse = Permission[]

export interface PermissionsService {
  getPermissions: (signal?: AbortSignal) => Promise<PermissionsResponse>
}
