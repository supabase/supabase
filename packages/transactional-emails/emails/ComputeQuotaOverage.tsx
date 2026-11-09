import { EmailLayout } from '../components/Layout'
import { Button, Heading, Hr, Section, Text } from '../components/Primitives'
import { Callout, ProjectUsageTable, UsageMeter } from '../components/UsageMeter'
import { theme } from '../theme'
import {
  billingUrl,
  formatMinutes,
  formatQuota,
  PREVIEW_QUOTA,
  usageUrl,
  type ComputeQuotaProps,
  type EmailTemplate,
} from './shared'

interface ComputeQuotaOverageProps extends ComputeQuotaProps {
  /** Formatted overage so far this cycle, e.g. "$4.20". */
  overageSoFar: string
  /** Projected overage by the end of the cycle, at the current rate. */
  projectedOverage: string
}

/**
 * Nothing is broken here: the spend cap is off, which is an explicit choice to pay for
 * headroom. So this is information, not an alarm — no warning colour on the primary message,
 * and no call to upgrade ahead of the number they actually want, which is the cost.
 */
const ComputeQuotaOverage = ({
  organizationName,
  organizationSlug,
  planName,
  includedVcpuMinutes,
  usedVcpuMinutes,
  cycleEndsOn,
  projects,
  overageSoFar,
  projectedOverage,
}: ComputeQuotaOverageProps) => (
  <EmailLayout
    preview={`Compute past the quota is now billed. ${overageSoFar} so far, about ${projectedOverage} by ${cycleEndsOn}.`}
    organizationName={organizationName}
    footerNote="Sent once per billing cycle, when usage first passes the included quota."
  >
    <Section>
      <Heading>Compute is now billing overage</Heading>
      <Text muted>
        {organizationName} has used the {formatMinutes(includedVcpuMinutes)} included in the{' '}
        {planName}. Workers keep running — Compute past the quota is billed at the overage rate.
      </Text>

      <UsageMeter
        label="Compute"
        value={formatQuota(usedVcpuMinutes, includedVcpuMinutes)}
        ratio={1}
        caption={`${formatMinutes(usedVcpuMinutes - includedVcpuMinutes)} over the quota`}
      />

      <Hr />

      <Callout tone="neutral">
        <strong>{overageSoFar} this cycle so far.</strong> At the current rate, about{' '}
        {projectedOverage} by {cycleEndsOn}.
      </Callout>

      <Text small muted>
        Where it went
      </Text>
      <ProjectUsageTable rows={projects} />

      <Hr />

      <Button href={usageUrl(organizationSlug)}>View Compute usage</Button>
      <Text small muted>
        To stop at the quota instead of billing overage, turn on the spend cap in{' '}
        <a href={billingUrl(organizationSlug)} style={{ color: theme.foregroundLight }}>
          billing
        </a>
        . Workers stop when the quota runs out.
      </Text>
    </Section>
  </EmailLayout>
)

export const computeQuotaOverage: EmailTemplate<ComputeQuotaOverageProps> = {
  id: 'compute-quota-overage',
  trigger:
    'Quota reaches 100% with the spend cap off, so usage continues and bills. Sent once per cycle.',
  subject: ({ organizationName }) => `${organizationName} has used its included Compute quota`,
  Template: ComputeQuotaOverage,
  previewProps: {
    ...PREVIEW_QUOTA,
    usedVcpuMinutes: 548,
    overageSoFar: '$0.12',
    projectedOverage: '$1.40',
  },
}
