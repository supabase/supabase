import { Addons } from 'components/interfaces/Settings/Addons/Addons'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import type { NextPageWithLayout } from 'types'

const ProjectAddons: NextPageWithLayout = () => {
  return <Addons />
}

ProjectAddons.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Add ons">
      <PageLayout title="Add ons" subtitle="Level up your project with add-ons">
        {page}
      </PageLayout>
    </SettingsLayout>
  </DefaultLayout>
)
export default ProjectAddons
