import type { platformComponents as components } from 'api-types'

import { FGA_PERMISSIONS, type FgaPermissions } from '@/hooks/misc/useCheckPermissionsV2'

export type PermissionsV2Response = components['schemas']['UserPermissionsResponse_Output']

export const ALL_FGA_PERMISSIONS: FgaPermissions[] = Object.values(FGA_PERMISSIONS).flatMap(
  (group) => Object.values(group)
)

/** Grants every FGA permission at the org level, which also covers every project in the org. */
export function allPermissionsFor(organizationSlugs: readonly string[]): PermissionsV2Response {
  return {
    organizations: organizationSlugs.map((slug) => ({
      slug,
      role: 'owner',
      permissions: ALL_FGA_PERMISSIONS,
      projects: [],
    })),
  }
}

/** No organization memberships, so every permission check is denied. */
export const NO_PERMISSIONS: PermissionsV2Response = { organizations: [] }
