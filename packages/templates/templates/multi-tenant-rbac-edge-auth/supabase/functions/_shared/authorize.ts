import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

import { forbidden, jsonError } from './responses.ts'
import type { AppPermission } from './types.ts'

export const ORGANIZATION_HEADER = 'x-organization-id'

export function getOrganizationId(req: Request): string | null {
  const organizationId = req.headers.get(ORGANIZATION_HEADER)?.trim()

  return organizationId && organizationId.length > 0 ? organizationId : null
}

export function requireOrganizationId(req: Request) {
  const organizationId = getOrganizationId(req)

  if (!organizationId) {
    return {
      response: jsonError(`missing ${ORGANIZATION_HEADER} header`, 400),
    } as const
  }

  return { organizationId } as const
}

export async function hasPermission(
  client: SupabaseClient,
  organizationId: string,
  permission: AppPermission
) {
  const { data, error } = await client.rpc('authorize', {
    requested_organization_id: organizationId,
    requested_permission: permission,
  })

  if (error) {
    throw error
  }

  return data === true
}

export async function requirePermission(
  client: SupabaseClient,
  organizationId: string,
  permission: AppPermission
) {
  const allowed = await hasPermission(client, organizationId, permission)

  if (!allowed) {
    return { response: forbidden() } as const
  }

  return { allowed: true as const }
}
