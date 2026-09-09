import { z } from 'zod'

import { get, handleError } from '@/data/fetchers'

/**
 * Read-only slices of the multiadmin API, surfaced through the mgmt-api
 * `/ha-admin` GET passthrough. The passthrough is a catch-all proxy, so these
 * paths aren't in Studio's generated OpenAPI types — each resource validates
 * the response against its own zod schema instead.
 *
 * mgmt-api forwards `/ha-admin/v1/<x>` → `/multiadmin/v1/<x>`, which the
 * project edge gateway rewrites to multiadmin's `/api/v1/<x>`.
 */
export async function getHaAdmin(
  projectRef: string | undefined,
  subPath: string,
  signal?: AbortSignal
): Promise<unknown> {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- off-schema passthrough path
    `/platform/projects/${projectRef}/ha-admin/v1/${subPath}` as any,
    { signal }
  )

  if (error) handleError(error)
  return data
}

/**
 * Validates a passthrough response, surfacing a readable error (which lands in
 * the diagram's AlertError fallback) instead of a raw zod issue dump.
 */
export function parseHaAdminResponse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Received an unexpected response from the cluster admin API')
  }
  return parsed.data
}
