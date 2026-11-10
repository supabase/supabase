import type { FunctionComponent } from 'react'

import type { ProjectUsageRow } from '../components/UsageMeter'

/**
 * A template is its subject plus its body. They are defined together because they fail
 * together: a subject that promises something the body does not say is the most common way a
 * transactional email goes wrong.
 */
export interface EmailTemplate<TProps extends object> {
  id: string
  /** One line on when this fires, for the preview index and for review. */
  trigger: string
  subject: (props: TProps) => string
  Template: FunctionComponent<TProps>
  previewProps: TProps
}

export interface ComputeQuotaProps {
  organizationName: string
  organizationSlug: string
  planName: string
  /** Included vCPU-hours for the cycle. Fractional: the allowance is under nine hours. */
  includedVcpuHours: number
  usedVcpuHours: number
  /** Formatted date the current billing cycle ends. */
  cycleEndsOn: string
  projects: ProjectUsageRow[]
}

export const dashboardUrl = (path: string) => `https://supabase.com/dashboard${path}`

export const usageUrl = (slug: string) => dashboardUrl(`/org/${slug}/usage#compute-services`)

export const billingUrl = (slug: string) => dashboardUrl(`/org/${slug}/billing`)

/**
 * Compute reads in vCPU-hours everywhere, below an hour included, so small values keep two
 * decimals rather than rounding to nothing.
 */
export const formatHours = (hours: number) => {
  const maximumFractionDigits = hours < 1 ? 2 : hours < 10 ? 1 : 0
  return `${hours.toLocaleString('en-US', { maximumFractionDigits })} vCPU-hrs`
}

/** "7.2 of 8.33 vCPU-hrs" — the unit belongs once, on the figure that carries it. */
export const formatQuota = (used: number, included: number) =>
  `${used.toLocaleString('en-US', { maximumFractionDigits: used < 10 ? 1 : 0 })} of ${formatHours(included)}`

/**
 * Preview values name their slot rather than inventing a customer. A plausible-looking
 * "Northwind" reads as a mockup of one account and invites review of the example instead of
 * the template; `[orgName]` says plainly that something gets substituted here.
 *
 * Figures stay concrete. A meter needs a number to have a width, and the copy around them
 * only reads correctly at a realistic magnitude.
 */
export const PREVIEW_PROJECTS: ProjectUsageRow[] = [
  { name: '[projectName1]', usage: '4.5 vCPU-hrs', share: 0.62 },
  { name: '[projectName2]', usage: '1.7 vCPU-hrs', share: 0.23 },
  { name: '[projectName3]', usage: '0.72 vCPU-hrs', share: 0.1 },
  { name: '[projectName4]', usage: '0.33 vCPU-hrs', share: 0.05 },
]

export const PREVIEW_QUOTA: ComputeQuotaProps = {
  organizationName: '[orgName]',
  organizationSlug: '[orgSlug]',
  planName: '[planName]',
  includedVcpuHours: 500 / 60,
  usedVcpuHours: 7.2,
  cycleEndsOn: '[cycleEndDate]',
  projects: PREVIEW_PROJECTS,
}
