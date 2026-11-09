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
  /** Included vCPU-minutes for the cycle. */
  includedVcpuMinutes: number
  usedVcpuMinutes: number
  /** Formatted date the current billing cycle ends. */
  cycleEndsOn: string
  projects: ProjectUsageRow[]
}

export const dashboardUrl = (path: string) => `https://supabase.com/dashboard${path}`

export const usageUrl = (slug: string) => dashboardUrl(`/org/${slug}/usage#compute-services`)

export const billingUrl = (slug: string) => dashboardUrl(`/org/${slug}/billing`)

export const formatMinutes = (minutes: number) =>
  `${Math.round(minutes).toLocaleString('en-US')} vCPU-min`

/** "432 of 500 vCPU-min" — the unit belongs once, on the figure that carries it. */
export const formatQuota = (used: number, included: number) =>
  `${Math.round(used).toLocaleString('en-US')} of ${formatMinutes(included)}`

/**
 * Preview values name their slot rather than inventing a customer. A plausible-looking
 * "Northwind" reads as a mockup of one account and invites review of the example instead of
 * the template; `[orgName]` says plainly that something gets substituted here.
 *
 * Figures stay concrete. A meter needs a number to have a width, and the copy around them
 * only reads correctly at a realistic magnitude.
 */
export const PREVIEW_PROJECTS: ProjectUsageRow[] = [
  { name: '[projectName1]', usage: '268 vCPU-min', share: 0.62 },
  { name: '[projectName2]', usage: '101 vCPU-min', share: 0.23 },
  { name: '[projectName3]', usage: '43 vCPU-min', share: 0.1 },
  { name: '[projectName4]', usage: '20 vCPU-min', share: 0.05 },
]

export const PREVIEW_QUOTA: ComputeQuotaProps = {
  organizationName: '[orgName]',
  organizationSlug: '[orgSlug]',
  planName: '[planName]',
  includedVcpuMinutes: 500,
  usedVcpuMinutes: 432,
  cycleEndsOn: '[cycleEndDate]',
  projects: PREVIEW_PROJECTS,
}
