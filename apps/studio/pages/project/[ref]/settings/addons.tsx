import Addons from 'components/interfaces/Settings/Addons/Addons'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const ProjectAddons: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Add ons</ScaffoldTitle>
          <ScaffoldDescription>Level up your project with add-ons</ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <Addons />
    </>
  )
}

ProjectAddons.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Add ons">{page}</SettingsLayout>
  </DefaultLayout>
)
export default ProjectAddons
