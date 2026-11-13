import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

export const WarehouseLoadingState = ({ label = 'Loading Warehouse' }: { label?: string }) => (
  <div aria-label={label} aria-busy="true">
    <GenericSkeletonLoader />
  </div>
)
