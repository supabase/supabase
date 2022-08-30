import { FC } from 'react'
import { IconBarChart2 } from '@supabase/ui'

interface Props {}

const EmptyState: FC<Props> = () => (
  <div
    className="
      h-full w-full py-4
      border border-dashed dark:border-dark
      flex flex-col items-center justify-center
    "
  >
    <div className="mb-2">
      <IconBarChart2 />
    </div>
    <p>No data to show</p>
  </div>
)

export default EmptyState
