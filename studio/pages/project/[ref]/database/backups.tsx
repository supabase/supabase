import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { Divider, Typography } from '@supabase/ui'

import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { BackupsList } from 'components/interfaces/Database'

const DatabaseBackups: NextPage = () => {
  return (
    <DatabaseLayout title="Database">
      <div className="flex">
        <div className="p-4 w-full my-2 max-w-4xl mx-auto space-y-8">
          <Typography.Title level={3} className="mb-0">
            Backups
          </Typography.Title>
          <Divider light />
          <div>
            <Typography.Text type="secondary">
              Projects are backed up daily and can be restored at any time.
            </Typography.Text>
          </div>
          <BackupsList />
        </div>
      </div>
    </DatabaseLayout>
  )
}

export default withAuth(observer(DatabaseBackups))
