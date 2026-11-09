import { EmailLayout } from '../components/Layout'
import { Button, Heading, Hr, Mono, Section, Text } from '../components/Primitives'
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

interface ComputeQuotaStoppedProps extends ComputeQuotaProps {
  stoppedWorkers: number
  /** Formatted date the next cycle starts and workers resume. */
  resumesOn: string
}

/**
 * The only Compute email that describes something already broken. Spend cap on means the
 * quota is a hard stop, so this is an outage notice, not a usage notice — it leads with what
 * stopped and what restores it, and the usage detail comes after.
 */
const ComputeQuotaStopped = ({
  organizationName,
  organizationSlug,
  planName,
  includedVcpuMinutes,
  usedVcpuMinutes,
  projects,
  stoppedWorkers,
  resumesOn,
}: ComputeQuotaStoppedProps) => (
  <EmailLayout
    preview={`${stoppedWorkers} workers stopped. Raise the spend cap or upgrade to start them again.`}
    organizationName={organizationName}
    footerNote="Sent once, when workers stop."
  >
    <Section>
      <Heading>Compute workers have stopped</Heading>
      <Text muted>
        {organizationName} used all {formatMinutes(includedVcpuMinutes)} included in the {planName}.
        The spend cap is on, so Compute stops at the quota rather than billing the overage.
      </Text>

      <Callout tone="destructive">
        <strong>{stoppedWorkers} workers are not running.</strong> Requests to them fail until the
        quota resets on {resumesOn}, the spend cap is turned off, or the plan changes.
      </Callout>

      <Button href={billingUrl(organizationSlug)}>Review billing</Button>
      <Text small muted>
        Turning the spend cap off starts the workers again and bills Compute past the quota at the
        overage rate.
      </Text>

      <Hr />

      <UsageMeter
        label="Compute"
        value={formatQuota(usedVcpuMinutes, includedVcpuMinutes)}
        ratio={1}
        tone="destructive"
        caption="Quota used in full"
      />

      <Hr />

      <Text small muted>
        Where it went
      </Text>
      <ProjectUsageTable rows={projects} />

      <Text small muted>
        Workers that never suspend consume the quota continuously. Check whether anything is running
        as a <Mono>private</Mono> worker that does not need to be, and see the{' '}
        <a href={usageUrl(organizationSlug)} style={{ color: theme.foregroundLight }}>
          usage breakdown
        </a>{' '}
        for the full picture.
      </Text>
    </Section>
  </EmailLayout>
)

export const computeQuotaStopped: EmailTemplate<ComputeQuotaStoppedProps> = {
  id: 'compute-quota-stopped',
  trigger:
    'Quota reaches 100% with the spend cap on, so workers are suspended. Sent immediately, once.',
  subject: ({ organizationName }) => `Compute workers stopped on ${organizationName}`,
  Template: ComputeQuotaStopped,
  previewProps: {
    ...PREVIEW_QUOTA,
    usedVcpuMinutes: 500,
    stoppedWorkers: 6,
    resumesOn: '1 December',
  },
}
