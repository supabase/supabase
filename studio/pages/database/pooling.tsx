import DatabaseLayout from 'components/layouts/DatabaseLayout'
import { Typography } from '@supabase/ui'

export default function DatabasePooling() {
  return (
    <DatabaseLayout title="Database Pooling">
      <div className="p-4">
        <Typography.Title level={4}>Database Pooling</Typography.Title>
      </div>
    </DatabaseLayout>
  )
}
