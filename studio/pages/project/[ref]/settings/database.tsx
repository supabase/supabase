import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { useFlag } from 'hooks'
import { useParams } from 'common/hooks'
import { SettingsLayout } from 'components/layouts'
import {
  ConnectionPooling,
  DatabaseSettings,
  NetworkRestrictions,
} from 'components/interfaces/Settings/Database'

import SSLConfiguration from 'components/interfaces/Settings/Database/SSLConfiguration'
import DiskSizeConfiguration from 'components/interfaces/Settings/Database/DiskSizeConfiguration'

const ProjectSettings: NextPageWithLayout = () => {
  const networkRestrictions = useFlag('networkRestrictions')

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 pt-6 pb-14 lg:px-16 xl:px-24 2xl:px-32">
      <div className="content h-full w-full overflow-y-auto space-y-10">
        <DatabaseSettings />
        <ConnectionPooling />
        <SSLConfiguration />
        <DiskSizeConfiguration />
        {networkRestrictions && <NetworkRestrictions />}
      </div>
    </div>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="Database">{page}</SettingsLayout>

export default observer(ProjectSettings)
