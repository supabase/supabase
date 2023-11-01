import Addons from 'components/interfaces/Settings/Addons/Addons'
import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const ProjectAddons: NextPageWithLayout = () => {
  return <Addons />
}

ProjectAddons.getLayout = (page) => <SettingsLayout title="Add ons">{page}</SettingsLayout>
export default ProjectAddons
