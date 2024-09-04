import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { ChevronUp } from 'lucide-react'
import { cn } from 'ui'

export interface RoleRowSkeletonProps {
  index?: number
}

const RoleRowSkeleton = ({ index }: RoleRowSkeletonProps) => {
  return (
    <div
      className={cn([
        'bg-surface-100',
        'data-open:bg-selection',
        'border-default',
        'data-open:border-strong',
        'data-open:pb-px col-span-12 mx-auto',
        '-space-y-px overflow-hidden',
        'border border-t-0 first:border-t first:!mt-0 shadow transition',
        'first:rounded-tl first:rounded-tr',
        'last:rounded-bl last:rounded-br',
      ])}
    >
      <div className="flex w-full items-center justify-between rounded py-3 px-6 text-foreground">
        <div className="flex items-start space-x-3">
          <ChevronUp
            id="collapsible-trigger"
            className="text-border-stronger rotate-180"
            strokeWidth={2}
            width={14}
          />
          <div className="space-x-2 flex items-center">
            <ShimmeringLoader className="h-4 w-20 py-0 my-0.5" delayIndex={index} />
            <ShimmeringLoader className="h-4 w-16 py-0 my-0.5" delayIndex={index} />
          </div>
        </div>

        <ShimmeringLoader className="h-4 w-[90px] py-0 my-0.5" delayIndex={index} />
      </div>
    </div>
  )
}

export default RoleRowSkeleton
