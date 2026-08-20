import { get, handleError } from '@/data/fetchers'

/**
 * Read-only slices of the multiadmin API, surfaced through the mgmt-api
 * `/ha-admin` GET passthrough. Types are a hand-copied subset of multiadmin's
 * OpenAPI spec — the passthrough is a catch-all proxy, so these paths aren't in
 * Studio's generated OpenAPI types. All response fields are optional because
 * proto3 JSON omits zero values.
 *
 * mgmt-api forwards `/ha-admin/v1/<x>` → `/multiadmin/v1/<x>`, which the
 * project edge gateway rewrites to multiadmin's `/api/v1/<x>`.
 */
export async function getHaAdmin<T>(
  projectRef: string | undefined,
  subPath: string,
  signal?: AbortSignal
): Promise<T> {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- off-schema passthrough path
    `/platform/projects/${projectRef}/ha-admin/v1/${subPath}` as any,
    { signal }
  )

  if (error) handleError(error)
  return data as T
}
