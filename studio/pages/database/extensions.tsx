import DatabaseLayout from 'components/layouts/DatabaseLayout'
import { Typography } from '@supabase/ui'

export default function DatabaseExtensions() {
  return (
    <DatabaseLayout title="Database Extensions">
      <div className="p-4">
        <Typography.Title level={4}>Database Extensions</Typography.Title>
      </div>
    </DatabaseLayout>
  )
}
