import { useSynchronizedAnimation } from 'hooks/misc/useSynchronizedAnimation'
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
  const ref = useSynchronizedAnimation<HTMLDivElement>('shimmer')

  return (
    <div
      ref={ref}
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
    <ShimmeringLoader className="w-3/4" delayIndex={1} />
    <ShimmeringLoader className="w-1/2" delayIndex={2} />
  </div>
)

export { GenericSkeletonLoader }
export default ShimmeringLoader
