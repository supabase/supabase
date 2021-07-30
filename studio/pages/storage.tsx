import StorageLayout from 'components/layouts/StorageLayout'
import { Typography } from '@supabase/ui'

export default function Storage() {
  return (
    <StorageLayout title="Storage">
      <>
        <Typography.Title level={3}>Storage</Typography.Title>
      </>
    </StorageLayout>
  )
}
