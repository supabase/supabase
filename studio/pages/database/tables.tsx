import DatabaseLayout from 'components/layouts/DatabaseLayout'
import { Typography } from '@supabase/ui'

export default function DatabaseTables() {
  return (
    <DatabaseLayout title="Database Tables">
      <div className="p-4">
        <Typography.Title level={4}>Database Tables</Typography.Title>
      </div>
    </DatabaseLayout>
  )
}
