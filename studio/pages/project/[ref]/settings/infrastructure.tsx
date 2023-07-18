import { useParams } from 'common'
import InfrastructureActivity from 'components/interfaces/Settings/Infrastructure/InfrastructureActivity'
import InfrastructureInfo from 'components/interfaces/Settings/Infrastructure/InfrastructureInfo'
import { SettingsLayout } from 'components/layouts'
import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { useSelectedOrganization } from 'hooks'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'
import { Alert } from 'ui'

const ProjectInfrastructure: NextPageWithLayout = () => {
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
          <Link href={`/project/${ref}/settings/billing/usage`}>
            <a className="text-brand-900">project's usage</a>
          </Link>{' '}
          page instead.
        </Alert>
      </div>
    )
  }

  return (
    <>
      <InfrastructureInfo />
      <ScaffoldDivider />
      <InfrastructureActivity />
    </>
  )
}

ProjectInfrastructure.getLayout = (page) => (
  <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
)

export default ProjectInfrastructure
