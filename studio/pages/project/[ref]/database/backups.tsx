import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { Typography } from '@supabase/ui'

import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { BackupsList } from 'components/interfaces/Database'

const DatabaseBackups: NextPage = () => {
  return (
    <DatabaseLayout title="Database">
      <div className="flex">
        <div className="p-4 w-full my-2 max-w-4xl mx-auto space-y-8">
          <h3 className="text-2xl">Backups</h3>
          <div className="space-y-4">
            <p className="text-sm text-scale-1100">
              Projects are backed up daily and can be restored at any time.
            </p>
            <BackupsList />
          </div>
        </div>
      </div>
    </DatabaseLayout>
  )
}

export default withAuth(observer(DatabaseBackups))
