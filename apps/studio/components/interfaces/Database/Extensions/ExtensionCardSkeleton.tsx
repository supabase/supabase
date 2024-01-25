import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Toggle } from 'ui'

export interface ExtensionCardSkeletonProps {
  index?: number
}

const ExtensionCardSkeleton = ({ index = 0 }: ExtensionCardSkeletonProps) => {
  return (
    <div className="flex border-overlay flex-col overflow-hidden rounded border shadow-sm">
      <div className="border-overlay bg-surface-100 flex justify-between w-full border-b py-3 px-4">
        <div className="flex items-center gap-1 max-w-[85%]">
          <div className="flex items-center space-x-2 truncate">
            <ShimmeringLoader className="h-5 w-32 m-0 text-foreground" delayIndex={index} />
          </div>
        </div>

        <Toggle size="tiny" checked={false} disabled={true} />
      </div>
      <div className="bg-panel-header-light bg-panel-secondary-light flex h-full flex-col justify-between">
        <div className="py-3 px-4">
          <ShimmeringLoader className="h-4 w-48" delayIndex={index} />
        </div>
      </div>
    </div>
  )
}

export default ExtensionCardSkeleton
