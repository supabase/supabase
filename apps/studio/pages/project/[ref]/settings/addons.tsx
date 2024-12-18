import Addons from 'components/interfaces/Settings/Addons/Addons'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
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
  <AppLayout>
    <DefaultLayout>
      <SettingsLayout title="Add ons">{page}</SettingsLayout>
    </DefaultLayout>
  </AppLayout>
)
export default ProjectAddons
