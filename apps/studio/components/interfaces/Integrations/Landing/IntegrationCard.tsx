import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

const INTEGRATION_CARD_STYLE = cn(
  'w-full h-full bg-surface-100 hover:bg-surface-200 hover:border-strong',
  'border border-border rounded-md ease-out duration-200 transition-all'
)

export const IntegrationLoadingCard = () => {
  return (
    <div className={cn(INTEGRATION_CARD_STYLE, 'pl-5 pr-6 py-3 gap-3 inline-flex h-[110px]')}>
      <div className="w-10 h-10 relative">
        <ShimmeringLoader className="w-full h-full bg-foreground-light border rounded-md" />
      </div>
      <div className="grow basis-0 w-full flex flex-col justify-between items-start gap-y-2">
        <div className="w-full flex-col justify-start items-start gap-y-1 flex">
          <ShimmeringLoader className="w-3/4 py-2.5" />
          <ShimmeringLoader className="w-full py-2.5" />
        </div>
      </div>
    </div>
  )
}
