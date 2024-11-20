import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'

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
      <div className="h-10 bg-dash-sidebar" />
      <div className="h-9 border-y" />

      <TableGridInnerLoadingState />
    </div>
  )
}
