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

export const PREVIEW_PROJECTS: ProjectUsageRow[] = [
  { name: 'checkout-api', usage: '268 vCPU-min', share: 0.62 },
  { name: 'image-pipeline', usage: '101 vCPU-min', share: 0.23 },
  { name: 'nightly-sync', usage: '43 vCPU-min', share: 0.1 },
  { name: 'staging', usage: '20 vCPU-min', share: 0.05 },
]

export const PREVIEW_QUOTA: ComputeQuotaProps = {
  organizationName: 'Northwind',
  organizationSlug: 'northwind',
  planName: 'Pro Plan',
  includedVcpuMinutes: 500,
  usedVcpuMinutes: 432,
  cycleEndsOn: '1 December',
  projects: PREVIEW_PROJECTS,
}
