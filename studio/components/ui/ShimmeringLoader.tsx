const ANIMATION_DELAY = 150

const ShimmeringLoader = ({ className = '', delayIndex = 0, animationDelay = 150 }) => {
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

export default ShimmeringLoader
