import type { Permission } from '@/types'

/**
 * Test-only fixtures for the scoped-access-token surfaces.
 *
 * The permission-row builders mirror the shape of /platform/profile/permissions rows for each
 * base role, per the ABAC default_permissions seeds (platform: middleware-db). Roles inherit
 * lower roles' rows. Keep the rows in lockstep with ROLE_PROBES in AccessToken.roles.ts.
 */

/** Satisfies both Studio's `Permission` type and the API's `AccessControlPermission` row shape. */
export type PermissionRowFixture = Permission & {
  organization_id: number | null
  project_ids: number[] | null
}

export const permissionRow = (
  organization_slug: string,
  actions: string[],
  resources: string[],
  project_refs: string[] = []
): PermissionRowFixture => ({
  actions: actions as Permission['actions'],
  condition: null as unknown as Permission['condition'],
  organization_id: null,
  organization_slug,
  project_ids: null,
  resources,
  restrictive: false,
  project_refs,
})

export const memberRows = (slug: string, refs: string[] = []) => [
  permissionRow(slug, ['read:Read'], ['members', 'organizations', 'auth.subject_roles'], refs),
]

export const readonlyRows = (slug: string, refs: string[] = []) => [
  ...memberRows(slug, refs),
  permissionRow(slug, ['analytics:Read', 'tenant:Sql:Read:Select'], ['%'], refs),
]

export const developerRows = (slug: string, refs: string[] = []) => [
  ...readonlyRows(slug, refs),
  permissionRow(
    slug,
    ['functions:Write', 'tenant:Sql:Admin:Write', 'tenant:Sql:Query'],
    ['%'],
    refs
  ),
]

export const administratorRows = (slug: string, refs: string[] = []) => [
  ...developerRows(slug, refs),
  permissionRow(slug, ['write:Create', 'write:Update'], ['projects'], refs),
  permissionRow(slug, ['billing:Write', 'infra:Execute'], ['%'], refs),
]

export const ownerRows = (slug: string, refs: string[] = []) => [
  ...administratorRows(slug, refs),
  permissionRow(slug, ['write:Update'], ['organizations'], refs),
  permissionRow(slug, ['write:Create', 'write:Delete'], ['auth.subject_roles'], refs),
]
