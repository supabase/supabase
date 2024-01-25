const HorizontalShimmerWithIcon = () => (
  <div className="flex w-full flex-row items-center justify-between gap-2">
    <div className="flex flex-row items-center gap-3">
      <div className="shimmering-loader h-6 w-6 rounded-full"></div>
      <div className="shimmering-loader h-2 w-32 rounded"></div>
    </div>
    <div className="shimmering-loader h-6 w-20 rounded"></div>
  </div>
)

export { HorizontalShimmerWithIcon }
