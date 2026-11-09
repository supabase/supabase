import { EmailLayout } from '../components/Layout'
import { Button, Heading, Hr, Section, Text } from '../components/Primitives'
import { Callout } from '../components/UsageMeter'
import { billingUrl, formatMinutes, usageUrl, type EmailTemplate } from './shared'

interface ComputeQuotaResetProps {
  organizationName: string
  organizationSlug: string
  planName: string
  includedVcpuMinutes: number
  /** vCPU-minutes consumed in the cycle that just ended. */
  previousCycleUsage: number
  resumedInstances: number
}

/**
 * Only sent to organizations whose instances were stopped. Everyone else gets a quota reset
 * every month without being told, and should.
 *
 * It is also the one upsell with evidence behind it: a plan that ran out once will run out
 * again, and this is the moment that argument is concrete rather than speculative.
 */
const ComputeQuotaReset = ({
  organizationName,
  organizationSlug,
  planName,
  includedVcpuMinutes,
  previousCycleUsage,
  resumedInstances,
}: ComputeQuotaResetProps) => {
  const overrun = previousCycleUsage - includedVcpuMinutes

  return (
    <EmailLayout
      preview={`${resumedInstances} instances are running again on a fresh ${includedVcpuMinutes} vCPU-minutes`}
      organizationName={organizationName}
      footerNote="Sent only when a new cycle restarts instances that had stopped."
    >
      <Section>
        <Heading>Compute instances are running again</Heading>
        <Text muted>
          The new billing cycle started, so {organizationName} has its{' '}
          {formatMinutes(includedVcpuMinutes)} back and {resumedInstances} instances have resumed.
        </Text>

        <Callout tone="warning">
          Last cycle used {formatMinutes(previousCycleUsage)} — {formatMinutes(overrun)} more than
          the {planName} includes. The same pattern will stop instances again before the cycle ends.
        </Callout>

        <Button href={billingUrl(organizationSlug)}>Compare plans</Button>
        <Text small muted>
          Turning off the spend cap keeps instances running past the quota and bills the overage
          instead.
        </Text>

        <Hr />

        <Button href={usageUrl(organizationSlug)} variant="secondary">
          View Compute usage
        </Button>
      </Section>
    </EmailLayout>
  )
}

export const computeQuotaReset: EmailTemplate<ComputeQuotaResetProps> = {
  id: 'compute-quota-reset',
  trigger:
    'A new billing cycle restores the quota for an organization whose instances were stopped. Not sent otherwise.',
  subject: ({ organizationName }) => `Compute quota reset for ${organizationName}`,
  Template: ComputeQuotaReset,
  previewProps: {
    organizationName: '[orgName]',
    organizationSlug: '[orgSlug]',
    planName: '[planName]',
    includedVcpuMinutes: 500,
    previousCycleUsage: 712,
    resumedInstances: 6,
  },
}
