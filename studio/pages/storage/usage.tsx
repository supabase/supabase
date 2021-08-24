import StorageLayout from 'components/layouts/StorageLayout'
import { Typography, IconBarChart } from '@supabase/ui'

export default function Usage() {
  return (
    <StorageLayout title="Usage Stats">
      <div className="h-full flex flex-col items-center justify-center">
        <IconBarChart size={72} />
        <Typography.Text type="secondary" className="mt-4">
          Usage statistics for storage are coming soon
        </Typography.Text>
      </div>
    </StorageLayout>
  )
}
