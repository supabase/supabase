import InfrastructureActivity from 'components/interfaces/Settings/Infrastructure/InfrastructureActivity'
import InfrastructureInfo from 'components/interfaces/Settings/Infrastructure/InfrastructureInfo'
import { SettingsLayout } from 'components/layouts'
import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { NextPageWithLayout } from 'types'

const ProjectInfrastructure: NextPageWithLayout = () => {
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
