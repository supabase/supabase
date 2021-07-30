import DatabaseLayout from 'components/layouts/DatabaseLayout'
import { Typography } from '@supabase/ui'

export default function DatabaseBackups() {
  return (
    <DatabaseLayout title="Backups">
      <div className="p-4">
        <Typography.Title level={4}>Backups</Typography.Title>
      </div>
    </DatabaseLayout>
  )
}
