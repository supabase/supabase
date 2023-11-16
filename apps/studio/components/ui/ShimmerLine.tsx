const ShimmerLine = ({ active }: { active: boolean }) => {
  return active ? <div className="logs-shimmering-loader w-full h-0.5"></div> : null
}

export default ShimmerLine
