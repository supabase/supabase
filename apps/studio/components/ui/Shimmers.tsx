import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const HorizontalShimmerWithIcon = () => (
  <div className="flex w-full flex-row items-center justify-between gap-2">
    <div className="flex flex-row items-center gap-3">
      <ShimmeringLoader className="h-6 w-6 shrink-0 rounded-full py-0" />
      <ShimmeringLoader className="h-2 w-32 py-0" />
    </div>
    <ShimmeringLoader className="h-6 w-20 py-0" />
  </div>
)
