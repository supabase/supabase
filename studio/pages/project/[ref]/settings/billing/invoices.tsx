import Link from 'next/link'

import { Invoices } from 'components/interfaces/BillingV2'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { Alert } from 'ui'

const ProjectBilling: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id

  if (isOrgBilling) {
    return (
      <div className="p-4">
        <Alert
          withIcon
          variant="info"
          title="This page is only available for projects which are on their own subscription"
        >
          You might be looking for the{' '}
          <Link href={`/org/${organization?.slug}/invoices`}>
            <a className="text-brand-900">organization's invoices</a>
          </Link>{' '}
          page instead.
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto content">
      <div className="w-full mx-auto">
        <Settings />
      </div>
    </div>
  )
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default ProjectBilling

const Settings = () => {
  const selectedOrganization = useSelectedOrganization()
  const { project: selectedProject } = useProjectContext()
  const orgSlug = selectedOrganization?.slug ?? ''

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      <div className="space-y-2">
        <h4 className="text-lg">Invoices</h4>

        <div className="text-sm text-scale-1000">
          To manage your billing address, emails or Tax ID, head to your{' '}
          <Link href={`/org/${orgSlug}/billing`}>
            <a>
              <span className="text-sm text-green-900 transition hover:text-green-1000">
                organization settings
              </span>
              .
            </a>
          </Link>
        </div>

        <Invoices projectRef={selectedProject?.ref ?? ''} />
      </div>
    </div>
  )
}
