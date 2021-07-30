import DatabaseLayout from 'components/layouts/DatabaseLayout'
import { Typography } from '@supabase/ui'

export default function DatabaseRoles() {
  return (
    <DatabaseLayout title="Database Roles">
      <div className="p-4">
        <Typography.Title level={4}>Database Roles</Typography.Title>
      </div>
    </DatabaseLayout>
  )
}
