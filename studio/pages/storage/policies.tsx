import StorageLayout from 'components/layouts/StorageLayout'
import { Typography } from '@supabase/ui'

export default function Policies() {
  return (
    <StorageLayout title="Storage Policies">
      <div className="p-4">
        <Typography.Title level={4}>Storage policies</Typography.Title>
        <Typography.Text type="secondary">
          Safeguard your files with policies that define the operations allowed for your users at
          the bucket level.
        </Typography.Text>
      </div>
    </StorageLayout>
  )
}
