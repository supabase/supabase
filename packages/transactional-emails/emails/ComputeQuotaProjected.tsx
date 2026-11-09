import { EmailLayout } from '../components/Layout'
import { Button, Heading, Hr, Mono, Section, Text } from '../components/Primitives'
import { Callout, ProjectUsageTable, UsageMeter } from '../components/UsageMeter'
import {
  formatMinutes,
  formatQuota,
  PREVIEW_QUOTA,
  usageUrl,
  type ComputeQuotaProps,
  type EmailTemplate,
} from './shared'

interface ComputeQuotaProjectedProps extends ComputeQuotaProps {
  /** Formatted date the current burn rate reaches the quota. */
  projectedExhaustionOn: string
  /** vCPU-minutes consumed per day over the trailing window. */
  dailyBurnRate: number
  /** The project responsible for most of the acceleration. */
  leadingProject: string
}

/**
 * The quota is 500 vCPU-minutes — eight hours and twenty minutes of one worker. A threshold
 * alert at 80% can arrive with less than two hours of headroom left, which is not a warning,
 * it is a receipt. This fires on the burn rate instead, so it can land before 80% does.
 */
const ComputeQuotaProjected = ({
  organizationName,
  organizationSlug,
  planName,
  includedVcpuMinutes,
  usedVcpuMinutes,
  cycleEndsOn,
  projects,
  projectedExhaustionOn,
  dailyBurnRate,
  leadingProject,
}: ComputeQuotaProjectedProps) => (
  <EmailLayout
    preview={`At the current rate the quota runs out on ${projectedExhaustionOn}, before the cycle ends ${cycleEndsOn}`}
    organizationName={organizationName}
    footerNote="Sent when the trailing burn rate first projects an overrun, and not again this cycle."
  >
    <Section>
      <Heading>Compute usage is on track to pass the quota</Heading>
      <Text muted>
        {organizationName} is using about {formatMinutes(dailyBurnRate)} a day. At that rate the{' '}
        {formatMinutes(includedVcpuMinutes)} included in the {planName} runs out on{' '}
        {projectedExhaustionOn} — the cycle ends on {cycleEndsOn}.
      </Text>

      <UsageMeter
        label="Compute"
        value={formatQuota(usedVcpuMinutes, includedVcpuMinutes)}
        ratio={usedVcpuMinutes / includedVcpuMinutes}
        caption={`Projected to reach the quota on ${projectedExhaustionOn}`}
      />

      <Hr />

      <Callout tone="warning">
        Most of the increase comes from <Mono>{leadingProject}</Mono>. A worker that stopped
        suspending on idle will burn the quota continuously.
      </Callout>

      <Text small muted>
        Where it went
      </Text>
      <ProjectUsageTable rows={projects} />

      <Hr />

      <Button href={usageUrl(organizationSlug)}>View Compute usage</Button>
    </Section>
  </EmailLayout>
)

export const computeQuotaProjected: EmailTemplate<ComputeQuotaProjectedProps> = {
  id: 'compute-quota-projected',
  trigger:
    'Trailing burn rate projects the quota running out before the cycle ends, with at least 48 hours of signal. Once per cycle, and before the 80% notice.',
  subject: ({ organizationName, projectedExhaustionOn }) =>
    `${organizationName} is on track to use its Compute quota by ${projectedExhaustionOn}`,
  Template: ComputeQuotaProjected,
  previewProps: {
    ...PREVIEW_QUOTA,
    usedVcpuMinutes: 290,
    projectedExhaustionOn: '22 November',
    dailyBurnRate: 38,
    leadingProject: 'image-pipeline',
    projects: [
      { name: 'image-pipeline', usage: '184 vCPU-min', share: 0.63 },
      { name: 'checkout-api', usage: '72 vCPU-min', share: 0.25 },
      { name: 'nightly-sync', usage: '24 vCPU-min', share: 0.08 },
      { name: 'staging', usage: '10 vCPU-min', share: 0.04 },
    ],
  },
}
