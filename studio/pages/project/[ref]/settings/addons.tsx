import { useParams } from 'common'
import Addons from 'components/interfaces/Settings/Addons'
import { SettingsLayout } from 'components/layouts'
import { useSelectedOrganization } from 'hooks'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'
import { Alert } from 'ui'

const ProjectAddons: NextPageWithLayout = () => {
  const { ref } = useParams()
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id

  if (!isOrgBilling) {
    return (
      <div className="p-4">
        <Alert
          withIcon
          variant="info"
          title="This page is only available for projects under an organization subscription"
        >
          You might be looking for the{' '}
          <Link href={`/project/${ref}/settings/billing/subscription`} className="text-brand">
            project's subscription
          </Link>{' '}
          page instead.
        </Alert>
      </div>
    )
  }

  return <Addons />
}

ProjectAddons.getLayout = (page) => <SettingsLayout title="Add ons">{page}</SettingsLayout>
export default ProjectAddons
