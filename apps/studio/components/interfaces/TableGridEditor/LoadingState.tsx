import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { Button, Skeleton } from 'ui'

export const TableGridInnerLoadingState = () => {
  return (
    <div className="p-2 col-span-full">
      <GenericSkeletonLoader />
    </div>
  )
}

export const TableGridSkeletonLoader = () => {
  return (
    <div className="flex flex-col">
      <div className="h-10 bg-dash-sidebar dark:bg-surface-100" />
      <div className="h-9 border-y" />
      <TableGridInnerLoadingState />
    </div>
  )
}
