import { COMPUTE_CAPACITY_WARNING_SLOTS, getComputeCapacity } from './ComputeUsage.utils'
import { CLI_NAME } from '@/lib/constants/compute'

/**
 * What the CLI says about Compute limits.
 *
 * The CLI is where the capacity and plan-gate limits are actually met: a developer deploying a
 * worker is at a terminal, mid-action, and an error there lands better than any dashboard
 * banner or email could. These builders exist so the message is written once and the dashboard
 * can show the same text next to the command it hands out — discovering a limit from a 403 you
 * were never warned about is the failure mode worth designing away.
 *
 * Four rules hold across all of them:
 *
 * 1. Warnings and errors go to stderr. Only data goes to stdout, so piping stays usable.
 * 2. Warn on write, inform on read. `push` warns; `list` states the headroom and moves on.
 * 3. A warning never fails a command. Only a hard stop exits non-zero.
 * 4. Every message names the remedy, with the command or the page that applies it.
 */

export type ComputeCliSeverity = 'info' | 'warning' | 'error'

export interface ComputeCliNotice {
  stream: 'stdout' | 'stderr'
  severity: ComputeCliSeverity
  /** Non-zero only when the command cannot proceed. */
  exitCode: number
  lines: string[]
}

const PREFIX: Record<ComputeCliSeverity, string> = {
  info: '',
  warning: 'Warning: ',
  error: 'Error: ',
}

const notice = (
  severity: ComputeCliSeverity,
  headline: string,
  remedy: string[]
): ComputeCliNotice => ({
  stream: severity === 'info' ? 'stdout' : 'stderr',
  severity,
  exitCode: severity === 'error' ? 1 : 0,
  lines: [`${PREFIX[severity]}${headline}`, ...(remedy.length > 0 ? ['', ...remedy] : [])],
})

export const formatCliNotice = (value: ComputeCliNotice): string => value.lines.join('\n')

/* ------------------------------------------------------------------ *
 * The org-wide quota                                                  *
 * ------------------------------------------------------------------ */

export interface ComputeQuotaCliInput {
  usedVcpuMinutes: number
  includedVcpuMinutes: number
  planName: string
  organizationSlug: string
  /** When on, the quota is a hard stop rather than the start of overage billing. */
  isSpendCapEnabled: boolean
  /** Below this fraction the command says nothing. */
  warningThreshold?: number
}

const usageUrl = (slug: string) => `https://supabase.com/dashboard/org/${slug}/usage`
const billingUrl = (slug: string) => `https://supabase.com/dashboard/org/${slug}/billing`

/**
 * Attached to writes — `push`, `new` — and to nothing else. Returns `null` below the
 * threshold, which is the common case and should stay silent.
 */
export const buildQuotaNotice = ({
  usedVcpuMinutes,
  includedVcpuMinutes,
  planName,
  organizationSlug,
  isSpendCapEnabled,
  warningThreshold = 0.8,
}: ComputeQuotaCliInput): ComputeCliNotice | null => {
  const remaining = includedVcpuMinutes - usedVcpuMinutes

  if (remaining <= 0 && isSpendCapEnabled) {
    return notice('error', `Compute quota used in full for this organization.`, [
      `  The spend cap is on, so workers stop at ${includedVcpuMinutes} vCPU-min rather than`,
      `  billing the overage. Nothing will deploy until the quota resets.`,
      '',
      `  Turn off the spend cap or change plan:`,
      `    ${billingUrl(organizationSlug)}`,
    ])
  }

  if (remaining <= 0) {
    return notice('warning', 'Compute past the included quota is billing overage.', [
      `  ${usedVcpuMinutes} of ${includedVcpuMinutes} vCPU-min used on the ${planName}.`,
      `  Workers keep running. Usage beyond the quota is billed at the Compute rate.`,
      '',
      `    ${usageUrl(organizationSlug)}`,
    ])
  }

  if (usedVcpuMinutes / includedVcpuMinutes < warningThreshold) return null

  return notice('warning', `${remaining} vCPU-min left in this billing cycle.`, [
    `  ${usedVcpuMinutes} of ${includedVcpuMinutes} vCPU-min used on the ${planName}.`,
    `  Run \`supabase ${CLI_NAME} usage\` for the breakdown by project.`,
  ])
}

/* ------------------------------------------------------------------ *
 * Per-project capacity                                                *
 * ------------------------------------------------------------------ */

export interface ComputeCapacityCliInput {
  runningInstances: number
  /** `null` when the plan sets no cap. */
  concurrentWorkers: number | null
  requestedInstances: number
  planName: string
  organizationSlug: string
}

/**
 * Capacity is binary, so this is an error when the deploy does not fit and a one-line
 * heads-up when it only just does. There is no middle state to warn about: a ratio means
 * nothing when the question is whether the next worker has somewhere to run.
 */
export const buildCapacityNotice = ({
  runningInstances,
  concurrentWorkers,
  requestedInstances,
  planName,
  organizationSlug,
}: ComputeCapacityCliInput): ComputeCliNotice | null => {
  const capacity = getComputeCapacity(runningInstances, concurrentWorkers)
  if (capacity.limit === null || capacity.remaining === null) return null

  if (requestedInstances > capacity.remaining) {
    return notice(
      'error',
      `Not enough concurrent workers: asked for ${requestedInstances}, ${capacity.remaining} available.`,
      [
        `  This project runs ${runningInstances} of ${capacity.limit} allowed by the ${planName}.`,
        '',
        `  Stop a worker, deploy fewer, or raise the limit:`,
        `    supabase ${CLI_NAME} list`,
        `    ${billingUrl(organizationSlug)}`,
      ]
    )
  }

  const remainingAfter = capacity.remaining - requestedInstances
  if (remainingAfter > COMPUTE_CAPACITY_WARNING_SLOTS) return null

  return notice(
    'info',
    `${remainingAfter} of ${capacity.limit} concurrent workers will be free after this deploy.`,
    []
  )
}

/* ------------------------------------------------------------------ *
 * Plan gates                                                          *
 * ------------------------------------------------------------------ */

export type ComputePlanGate = 'size' | 'private' | 'invocationDuration'

export interface ComputePlanGateCliInput {
  gate: ComputePlanGate
  planName: string
  organizationSlug: string
  /** The value that was asked for: a size name, or a duration in minutes. */
  requested: string
}

/**
 * The strongest upsell moment in the product, and the reason these are worth writing
 * carefully: the developer has already said what they want. "Not on this plan" answers an
 * explicit request, where a quota alert interrupts someone who asked for nothing.
 */
export const buildPlanGateNotice = ({
  gate,
  planName,
  organizationSlug,
  requested,
}: ComputePlanGateCliInput): ComputeCliNotice => {
  const upgrade = [`  Compare plans:`, `    ${billingUrl(organizationSlug)}`]

  if (gate === 'size') {
    return notice('error', `Size ${requested} is not available on the ${planName}.`, [
      `  Deploy at the base size, or upgrade for larger workers.`,
      '',
      ...upgrade,
    ])
  }

  if (gate === 'private') {
    return notice('error', `Private workers are not available on the ${planName}.`, [
      `  Private workers never suspend, so they consume the quota continuously.`,
      `  Deploy with \`--exposure public\`, or upgrade to run private workers.`,
      '',
      ...upgrade,
    ])
  }

  return notice('error', `Invocation ran past the ${requested}-minute limit on the ${planName}.`, [
    `  The worker was stopped mid-request. Split the work into shorter invocations,`,
    `  or upgrade to remove the per-invocation cap.`,
    '',
    ...upgrade,
  ])
}

/* ------------------------------------------------------------------ *
 * The read surface: `supabase compute usage`                          *
 * ------------------------------------------------------------------ */

export interface ComputeUsageReportInput {
  organizationName: string
  planName: string
  usedVcpuMinutes: number
  includedVcpuMinutes: number
  cycleEndsOn: string
  /** Formatted date the current rate reaches the quota, or `null` when it does not. */
  projectedExhaustionOn: string | null
  projects: { name: string; vcpuMinutes: number; runningInstances: number }[]
  concurrentWorkers: number | null
}

const bar = (ratio: number, width = 24) => {
  const filled = Math.round(Math.min(Math.max(ratio, 0), 1) * width)
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`
}

/**
 * Deliberately the same three facts the dashboard leads with — quota, burn-down, projects —
 * so that someone moving between the two is reading one model rather than two. The
 * projection line is the part a terminal can give that a monthly email cannot.
 */
export const buildUsageReport = ({
  organizationName,
  planName,
  usedVcpuMinutes,
  includedVcpuMinutes,
  cycleEndsOn,
  projectedExhaustionOn,
  projects,
  concurrentWorkers,
}: ComputeUsageReportInput): string[] => {
  const ratio = usedVcpuMinutes / includedVcpuMinutes
  const nameWidth = Math.max(...projects.map((project) => project.name.length), 7)
  const workerCount = (running: number) =>
    concurrentWorkers === null ? `${running}` : `${running} / ${concurrentWorkers}`

  return [
    `${organizationName} · ${planName} · cycle ends ${cycleEndsOn}`,
    '',
    `  Compute   ${bar(ratio)}  ${usedVcpuMinutes} / ${includedVcpuMinutes} vCPU-min`,
    ...(projectedExhaustionOn === null
      ? []
      : [`              projected to reach the quota on ${projectedExhaustionOn}`]),
    '',
    `  ${'PROJECT'.padEnd(nameWidth)}   VCPU-MIN   SHARE   WORKERS`,
    ...projects.map((project) => {
      const share = `${Math.round((project.vcpuMinutes / usedVcpuMinutes) * 100)}%`
      return [
        `  ${project.name.padEnd(nameWidth)}`,
        `${String(project.vcpuMinutes).padStart(10)}`,
        `${share.padStart(7)}`,
        `${workerCount(project.runningInstances).padStart(10)}`,
      ].join('')
    }),
  ]
}
