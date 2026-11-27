/** Compute is billed hourly; the platform prices a full month as 744 hours. */
const BILLABLE_HOURS_PER_MONTH = 744

/** Compute credit included on every paid plan, applied per organization, not per project. */
export const MONTHLY_COMPUTE_CREDIT = 10

export interface ComputeVariantPrice {
  price: number
  price_interval: 'monthly' | 'hourly'
}

export const getMonthlyComputePrice = ({ price, price_interval }: ComputeVariantPrice) =>
  price_interval === 'hourly' ? price * BILLABLE_HOURS_PER_MONTH : price

export interface ResumeComputeCost {
  monthlyPrice: number
  /** 0 when another active project in the organization is already using the credit. */
  credit: number
  monthlyTotal: number
  isCovered: boolean
}

/**
 * The compute credit only applies when no other project in the organization is active,
 * since an active project consumes it first.
 */
export const getResumeComputeCost = ({
  monthlyPrice,
  hasActiveProjects,
}: {
  monthlyPrice: number
  hasActiveProjects: boolean
}): ResumeComputeCost => {
  const credit = hasActiveProjects ? 0 : Math.min(MONTHLY_COMPUTE_CREDIT, monthlyPrice)

  return {
    monthlyPrice,
    credit,
    monthlyTotal: monthlyPrice - credit,
    isCovered: monthlyPrice > 0 && credit === monthlyPrice,
  }
}
