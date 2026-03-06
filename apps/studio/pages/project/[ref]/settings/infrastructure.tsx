import { InfrastructureActivity } from 'components/interfaces/Settings/Infrastructure/InfrastructureActivity'
import { InfrastructureInfo } from 'components/interfaces/Settings/Infrastructure/InfrastructureInfo'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const ProjectInfrastructure: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Infrastructure</ScaffoldTitle>
          <ScaffoldDescription>
            General information regarding your server instance
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <InfrastructureInfo />
      <ScaffoldDivider />
      <InfrastructureActivity />
    </>
  )
}

ProjectInfrastructure.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
  </DefaultLayout>
)

export default ProjectInfrastructure
