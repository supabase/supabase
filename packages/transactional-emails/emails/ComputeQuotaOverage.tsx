import { EmailLayout } from '../components/Layout'
import { Button, Heading, Hr, Section, Text } from '../components/Primitives'
import { CostBreakdown, ProjectUsageTable, UsageMeter } from '../components/UsageMeter'
import { theme } from '../theme'
import {
  billingUrl,
  formatHours,
  formatQuota,
  PREVIEW_QUOTA,
  PRICING_URL,
  usageUrl,
  type ComputeQuotaProps,
  type EmailTemplate,
} from './shared'

interface ComputeQuotaOverageProps extends ComputeQuotaProps {
  /**
   * The overage, already costed. The billing system supplies these; a template that worked
   * them out from a rate would be a second place for the rate to be wrong.
   */
  overage: {
    vcpuHours: string
    vcpuRate: string
    vcpuCost: string
    gbHours: string
    gbRate: string
    gbCost: string
    total: string
    /** Projected total by the end of the cycle, at the current rate. */
    projectedTotal: string
  }
}

/**
 * Nothing is broken here: the spend cap is off, which is an explicit choice to pay for
 * headroom. So this is information, not an alarm — no warning colour on the primary message,
 * and no call to upgrade ahead of the number they actually want, which is the cost.
 *
 * The cost is itemised rather than quoted as a total, matching the usage page. The same
 * overage bills on two dimensions, and the memory line being exactly twice the vCPU one is
 * the clearest statement of why.
 */
const ComputeQuotaOverage = ({
  organizationName,
  organizationSlug,
  planName,
  includedVcpuHours,
  usedVcpuHours,
  cycleEndsOn,
  projects,
  overage,
}: ComputeQuotaOverageProps) => (
  <EmailLayout
    preview={`Compute past the quota is now billed. ${overage.total} so far, about ${overage.projectedTotal} by ${cycleEndsOn}.`}
    organizationName={organizationName}
    footerNote="Sent once per billing cycle, when usage first passes the included quota."
  >
    <Section>
      <Heading>Compute is now billing overage</Heading>
      <Text muted>
        {organizationName} has used the {formatHours(includedVcpuHours)} included in the {planName}.
        Instances keep running — Compute past the quota is billed at the overage rate.
      </Text>

      <UsageMeter
        label="Compute"
        value={formatQuota(usedVcpuHours, includedVcpuHours)}
        ratio={1}
        // Reads the costed figure rather than recomputing it, so the meter and the cost line
        // below cannot print the same quantity at two precisions.
        caption={`${overage.vcpuHours} over the quota`}
      />

      <Hr />

      <Text small muted>
        What that costs
      </Text>
      <CostBreakdown
        lines={[
          {
            label: 'Compute over quota',
            detail: `${overage.vcpuHours} × ${overage.vcpuRate}`,
            amount: overage.vcpuCost,
          },
          {
            label: 'Memory over quota',
            detail: `${overage.gbHours} × ${overage.gbRate}`,
            amount: overage.gbCost,
          },
          { label: 'This cycle so far', amount: overage.total, isTotal: true },
        ]}
      />
      <Text small muted>
        At the current rate, about {overage.projectedTotal} by {cycleEndsOn}.{' '}
        <a href={PRICING_URL} style={{ color: theme.foregroundLight }}>
          See pricing
        </a>
      </Text>

      <Hr />

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
        . Instances stop when the quota runs out.
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
    usedVcpuHours: 9.1,
    // Mirrors the illustrative rates the usage page shows, applied to 0.77 vCPU-hrs over an
    // 8.33 allowance. Experimental, like everything else about the pricing here.
    overage: {
      vcpuHours: '0.8 vCPU-hrs',
      vcpuRate: '$0.15',
      vcpuCost: '$0.12',
      gbHours: '1.5 GB-hrs',
      gbRate: '$0.02',
      gbCost: '$0.03',
      total: '$0.15',
      projectedTotal: '$1.40',
    },
  },
}
