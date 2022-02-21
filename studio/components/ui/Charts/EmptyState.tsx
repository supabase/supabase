import { FC } from 'react'
import { Typography, IconBarChart2 } from '@supabase/ui'

interface Props {}

const EmptyState: FC<Props> = () => (
  <div
    className="
      h-full w-full py-4
      border border-dashed dark:border-dark
      flex flex-col items-center justify-center
    "
  >
    <Typography.Text className="mb-2">
      <IconBarChart2 />
    </Typography.Text>
    <Typography.Text>No data to show</Typography.Text>
  </div>
)

export default EmptyState
