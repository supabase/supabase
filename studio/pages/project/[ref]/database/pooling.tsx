import { observer } from 'mobx-react-lite'

import { DatabaseLayout } from 'components/layouts'
import { BouncerSettings } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'

const DatabasePooling: NextPageWithLayout = () => {
  return (
    <div className="content h-full w-full overflow-y-auto">
      <div className="mx-auto h-full w-full">
        <BouncerSettings />
      </div>
    </div>
  )
}

DatabasePooling.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabasePooling)
