/**
 * Overage rates, rounded from the pricing RFC so the arithmetic on screen is legible and the
 * totals land in a realistic range. Experimental: nothing here is agreed, and the UI says so
 * wherever it shows a figure derived from them. Replace with the approved rates and drop
 * `isIllustrative` when pricing is signed off.
 */
export const COMPUTE_OVERAGE_RATES = {
  perVcpuHour: 0.15,
  perGbHour: 0.02,
  isIllustrative: true,
} as const

/** Memory is pinned at this ratio on every size, so GB-hours follow vCPU-hours exactly. */
export const COMPUTE_GB_PER_VCPU = 2

export interface ComputeOverageEstimate {
  vcpuHours: number
  gbHours: number
  vcpuCost: number
  gbCost: number
  total: number
}

/**
 * What the usage past the quota would cost. The quota is counted in vCPU-hours alone, but the
 * rate card prices memory separately, so the same overage is billed twice over: once as vCPU
 * and once as the memory pinned to it. Deriving the GB-hours here rather than taking them as
 * an input is what keeps the two from drifting apart in the display.
 */
export const estimateComputeOverage = (
  usedVcpuHours: number,
  includedVcpuHours: number | null
): ComputeOverageEstimate | null => {
  if (includedVcpuHours === null) return null

  const vcpuHours = usedVcpuHours - includedVcpuHours
  if (vcpuHours <= 0) return null

  const gbHours = vcpuHours * COMPUTE_GB_PER_VCPU
  const vcpuCost = vcpuHours * COMPUTE_OVERAGE_RATES.perVcpuHour
  const gbCost = gbHours * COMPUTE_OVERAGE_RATES.perGbHour

  return { vcpuHours, gbHours, vcpuCost, gbCost, total: vcpuCost + gbCost }
}
