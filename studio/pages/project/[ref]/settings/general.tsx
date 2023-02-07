import { observer } from 'mobx-react-lite'

import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import {
  General,
  Infrastructure,
  CustomDomainConfig,
  DeleteProjectPanel,
} from 'components/interfaces/Settings/General'

const ProjectSettings: NextPageWithLayout = () => {
  // [Joshen] Opting for larger gap instead of gap-8 as compared to other pages for better grouping of content
  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <General />
      <Infrastructure />
      <CustomDomainConfig />
      <DeleteProjectPanel />
    </div>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="General">{page}</SettingsLayout>
export default observer(ProjectSettings)
