import { cn } from 'ui'

export interface ShimmeringLoader {
  className?: string
  delayIndex?: number
  animationDelay?: number
}

const ShimmeringLoader = ({
  className,
  delayIndex = 0,
  animationDelay = 150,
}: ShimmeringLoader) => {
  return (
    <div
      className={cn('shimmering-loader rounded py-3', className)}
      style={{
        animationFillMode: 'backwards',
        animationDelay: `${delayIndex * animationDelay}ms`,
      }}
    />
  )
}

const GenericSkeletonLoader = () => (
  <div className="space-y-2">
    <ShimmeringLoader />
    <ShimmeringLoader className="w-3/4" />
    <ShimmeringLoader className="w-1/2" />
  </div>
)

export { GenericSkeletonLoader }
export default ShimmeringLoader
