const ANIMATION_DELAY = 150

const ShimmeringLoader = ({ className = '', delayIndex = 0, animationDelay = ANIMATION_DELAY }) => {
  return (
    <div
      className={`shimmering-loader rounded py-3 ${className}`}
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
