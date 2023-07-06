import InfrastructureActivity from 'components/interfaces/Settings/Infrastructure/InfrastructureActivity'
import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const ProjectInfrastructure: NextPageWithLayout = () => {
  return <InfrastructureActivity />
}

ProjectInfrastructure.getLayout = (page) => (
  <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
)

export default ProjectInfrastructure
