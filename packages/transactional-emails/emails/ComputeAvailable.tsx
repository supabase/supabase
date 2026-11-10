import { EmailLayout } from '../components/Layout'
import { Button, Heading, Hr, Mono, Section, Text } from '../components/Primitives'
import { dashboardUrl, formatHours, type EmailTemplate } from './shared'

interface ComputeAvailableProps {
  organizationName: string
  organizationSlug: string
  planName: string
  includedVcpuHours: number
  concurrentInstances: number
}

/**
 * The one onboarding email worth sending. "You deployed your first instance" is a notification
 * about something the developer just watched happen in their own terminal; this is the only
 * moment where the inbox knows something the dashboard has not already said.
 *
 * It states the two limits up front on purpose. A quota met as a surprise is a support
 * ticket; a quota read on day one is a design constraint.
 */
const ComputeAvailable = ({
  organizationName,
  organizationSlug,
  planName,
  includedVcpuHours,
  concurrentInstances,
}: ComputeAvailableProps) => (
  <EmailLayout
    preview={`${formatHours(includedVcpuHours)} a month and ${concurrentInstances} concurrent instances per project`}
    organizationName={organizationName}
  >
    <Section>
      <Heading>Compute is available on {organizationName}</Heading>
      <Text muted>
        Deploy an instance from the CLI with <Mono>supabase compute new</Mono>, then{' '}
        <Mono>supabase compute deploy</Mono>. Instances suspend when idle, so nothing accrues
        between requests.
      </Text>

      <Hr />

      <Text small muted>
        What the {planName} includes
      </Text>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td style={{ padding: '6px 0', fontSize: '14px' }}>Compute</td>
            <td align="right" style={{ padding: '6px 0', fontSize: '14px' }}>
              {formatHours(includedVcpuHours)} a month
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0', fontSize: '14px' }}>Concurrent instances</td>
            <td align="right" style={{ padding: '6px 0', fontSize: '14px' }}>
              {concurrentInstances} per project
            </td>
          </tr>
        </tbody>
      </table>

      <Hr />

      <Text small muted>
        A vCPU-hour is one hour of one vCPU. An instance at the base size uses one an hour; a larger
        one uses more. Suspended instances use none.
      </Text>

      <Button href={dashboardUrl(`/org/${organizationSlug}/usage#compute-services`)}>
        View Compute usage
      </Button>
    </Section>
  </EmailLayout>
)

export const computeAvailable: EmailTemplate<ComputeAvailableProps> = {
  id: 'compute-available',
  trigger: 'Compute is enabled for the organization. Sent once.',
  subject: ({ organizationName }) => `Compute is available on ${organizationName}`,
  Template: ComputeAvailable,
  previewProps: {
    organizationName: '[orgName]',
    organizationSlug: '[orgSlug]',
    planName: '[planName]',
    includedVcpuHours: 500 / 60,
    concurrentInstances: 10,
  },
}
