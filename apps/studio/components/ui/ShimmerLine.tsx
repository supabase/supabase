import { cn } from 'ui'

const ShimmerLine = ({ active, className }: { active: boolean; className?: string }) => {
  return active ? (
    <div className={cn('logs-shimmering-loader w-full h-0.5', className)}></div>
  ) : null
}

export default ShimmerLine
