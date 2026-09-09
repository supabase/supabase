import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from 'ui'

export default function DisabledInferredActions() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Pagination boundary</p>
        <div className="flex items-center gap-2">
          <Button icon={<ChevronLeft />} disabled>
            Previous
          </Button>
          <span className="text-foreground-light text-sm">Page 1 of 4</span>
          <Button iconRight={<ChevronRight />}>Next</Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Reorder boundary</p>
        <p className="text-foreground-light text-sm">First item selected</p>
        <div className="flex gap-2">
          <Button icon={<ArrowUp />} disabled>
            Move up
          </Button>
          <Button icon={<ArrowDown />}>Move down</Button>
        </div>
      </div>
    </div>
  )
}
