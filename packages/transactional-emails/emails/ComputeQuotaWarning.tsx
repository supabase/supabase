import { EmailLayout } from '../components/Layout'
import { Button, Heading, Hr, Section, Text } from '../components/Primitives'
import { ProjectUsageTable, UsageMeter } from '../components/UsageMeter'
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

const ComputeQuotaWarning = ({
  organizationName,
  organizationSlug,
  planName,
  includedVcpuMinutes,
  usedVcpuMinutes,
  cycleEndsOn,
  projects,
}: ComputeQuotaProps) => {
  const remaining = Math.max(includedVcpuMinutes - usedVcpuMinutes, 0)

  return (
    <EmailLayout
      preview={`${formatMinutes(remaining)} left until ${cycleEndsOn}`}
      organizationName={organizationName}
      footerNote="Sent once per billing cycle, the first time usage passes 80%."
    >
      <Section>
        <Heading>80% of the Compute quota is used</Heading>
        <Text muted>
          {organizationName} has used {formatMinutes(usedVcpuMinutes)} of the{' '}
          {formatMinutes(includedVcpuMinutes)} included in the {planName}. The cycle ends on{' '}
          {cycleEndsOn}.
        </Text>

        <UsageMeter
          label="Compute"
          value={formatQuota(usedVcpuMinutes, includedVcpuMinutes)}
          ratio={usedVcpuMinutes / includedVcpuMinutes}
          tone="warning"
          caption={`${formatMinutes(remaining)} remaining`}
        />

        <Hr />

        <Text small muted>
          Where it went
        </Text>
        <ProjectUsageTable rows={projects} />

        <Hr />

        <Text>
          Going over the quota bills the overage at the Compute rate. Nothing stops running.
        </Text>
        <Button href={usageUrl(organizationSlug)}>View Compute usage</Button>
        <Text small muted>
          Or{' '}
          <a href={billingUrl(organizationSlug)} style={{ color: theme.foregroundLight }}>
            review billing
          </a>{' '}
          to change the plan or the spend cap.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export const computeQuotaWarning: EmailTemplate<ComputeQuotaProps> = {
  id: 'compute-quota-warning',
  trigger: 'Org-wide vCPU-minute usage crosses 80% of the included quota. Once per cycle.',
  subject: ({ organizationName }) => `${organizationName} has used 80% of its Compute quota`,
  Template: ComputeQuotaWarning,
  previewProps: PREVIEW_QUOTA,
}
