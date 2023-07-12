import Link from 'next/link'

import Usage from 'components/interfaces/BillingV2/Usage/Usage'
import { SettingsLayout } from 'components/layouts'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { Alert } from 'ui'
import { useParams } from 'common'

const ProjectBillingUsage: NextPageWithLayout = () => {
  const { ref } = useParams()
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
          Project usage statistics have been shifted to the{' '}
          <Link href={`/org/${organization?.slug}/usage?projectRef=${ref}`}>
            <a className="text-brand-900">organization's usage</a>
          </Link>{' '}
          page instead.
        </Alert>
      </div>
    )
  }

  return <Usage />
}

ProjectBillingUsage.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default ProjectBillingUsage
