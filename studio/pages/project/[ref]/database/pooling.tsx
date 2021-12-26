import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { BouncerSettings } from 'components/interfaces/Database'

const DatabasePooling: NextPage = () => {
  return (
    <DatabaseLayout title="Database">
      <div className="content w-full h-full overflow-y-auto">
        <div className="mx-auto h-full w-full">
          <BouncerSettings />
        </div>
      </div>
    </DatabaseLayout>
  )
}

export default withAuth(observer(DatabasePooling))
