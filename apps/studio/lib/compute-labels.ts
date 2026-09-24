/** Compute sizes below Large run on shared compute; Large and up are dedicated. */
const SHARED_COMPUTE_SIZES = ['pico', 'nano', 'micro', 'small', 'medium']

export const isSharedComputeSize = (size: string) =>
  SHARED_COMPUTE_SIZES.includes(size.toLowerCase().replace(/^ci_/, ''))

/**
 * User-facing CPU description for a compute size. Branches on the size itself,
 * not on `meta.cpu_cores` — the platform is dropping that field.
 */
export const getComputeCpuLabel = (size: string, vcpuCount?: number) => {
  if (isSharedComputeSize(size)) return 'Shared compute'
  return typeof vcpuCount === 'number' ? `Dedicated · ${vcpuCount} vCPUs` : 'Dedicated compute'
}
