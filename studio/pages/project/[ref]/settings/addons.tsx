import InfrastructureActivity from 'components/interfaces/Settings/Infrastructure/InfrastructureActivity'
import InfrastructureInfo from 'components/interfaces/Settings/Infrastructure/InfrastructureInfo'
import { SettingsLayout } from 'components/layouts'
import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { NextPageWithLayout } from 'types'

const ProjectAddons: NextPageWithLayout = () => {
  return (
    <>
      <div>Hello</div>
    </>
  )
}

ProjectAddons.getLayout = (page) => <SettingsLayout title="Add ons">{page}</SettingsLayout>

export default ProjectAddons
