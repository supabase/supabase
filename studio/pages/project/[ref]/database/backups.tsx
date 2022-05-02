import { observer } from 'mobx-react-lite'

import { DatabaseLayout } from 'components/layouts'
import { BackupsList } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'

const DatabaseBackups: NextPageWithLayout = () => {
  return (
    <div className="flex">
      <div className="my-2 mx-auto w-full max-w-4xl space-y-8 p-4">
        <h3 className="text-2xl">Backups</h3>
        <div className="space-y-4">
          <p className="text-scale-1100 text-sm">
            Projects are backed up daily and can be restored at any time.
          </p>
          <BackupsList />
        </div>
      </div>
    </div>
  )
}

DatabaseBackups.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseBackups)
