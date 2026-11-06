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

const COMPUTE_SIZE_LABELS: Record<string, string> = {
  pico: 'Pico',
  nano: 'Nano',
  micro: 'Micro',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  xlarge: 'XL',
  '2xlarge': '2XL',
  '4xlarge': '4XL',
  '8xlarge': '8XL',
  '12xlarge': '12XL',
  '16xlarge': '16XL',
  '24xlarge': '24XL',
  '24xlarge_optimized_memory': '24XL - Optimized Memory',
  '24xlarge_optimized_cpu': '24XL - Optimized CPU',
  '24xlarge_high_memory': '24XL - High Memory',
  '48xlarge': '48XL',
  '48xlarge_optimized_memory': '48XL - Optimized Memory',
  '48xlarge_optimized_cpu': '48XL - Optimized CPU',
  '48xlarge_high_memory': '48XL - High Memory',
}

/**
 * User-facing label for a project's compute size (`infra_compute_size`),
 * e.g. 'medium' → "Medium", '2xlarge' → "2XL".
 *
 * Always label compute from `infra_compute_size` — it is the authoritative
 * project-level size. `databases[].size` holds an internal identifier that
 * is not shown in the UI. Unknown values return undefined so callers render
 * nothing instead of a raw value.
 */
export const getComputeSizeLabel = (size: string | null | undefined): string | undefined =>
  size ? COMPUTE_SIZE_LABELS[size.toLowerCase().replace(/^ci_/, '')] : undefined
