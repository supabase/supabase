import Link from 'next/link'

import SubscriptionV2 from 'components/interfaces/BillingV2/Subscription/Subscription'
import { SettingsLayout } from 'components/layouts'
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
          Subscription management can be found on the{' '}
          <Link href={`/org/${organization?.slug}/billing`}>
            <a className="text-brand-900">organization's billing</a>
          </Link>{' '}
          page instead.
        </Alert>
      </div>
    )
  }

  return <SubscriptionV2 />
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default ProjectBilling
