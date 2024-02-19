import { Meta } from '@storybook/react'
import { Skeleton } from '../ui/skeleton'

const meta: Meta = {
  title: 'shadcn/Skeleton',
  component: Skeleton,
}

export function Default() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

export default meta
