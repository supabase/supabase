import { X } from 'lucide-react'
import { Button, ToggleGroup, ToggleGroupItem } from 'ui'

export type UserActivityView = 'timeline' | 'table'
export type UserActivityFilter = 'all' | 'errors'

interface UserActivityControlsProps {
  view: UserActivityView
  onViewChange: (view: UserActivityView) => void
  filter: UserActivityFilter
  onFilterChange: (filter: UserActivityFilter) => void
  /** Preformatted label for the selected date, e.g. "May 14, 2026". `null` hides the chip. */
  dateLabel: string | null
  onClearDate: () => void
}

export const UserActivityControls = ({
  view,
  onViewChange,
  filter,
  onFilterChange,
  dateLabel,
  onClearDate,
}: UserActivityControlsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <ToggleGroup
        type="single"
        value={view}
        variant="outline"
        size="sm"
        onValueChange={(value) => {
          if (value) onViewChange(value as UserActivityView)
        }}
      >
        <ToggleGroupItem value="timeline" className="px-2 py-1 h-7 text-xs">
          Timeline
        </ToggleGroupItem>
        <ToggleGroupItem value="table" className="px-2 py-1 h-7 text-xs">
          Table
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        type="single"
        value={filter}
        variant="outline"
        size="sm"
        onValueChange={(value) => {
          if (value) onFilterChange(value as UserActivityFilter)
        }}
      >
        <ToggleGroupItem value="all" className="px-2 py-1 h-7 text-xs">
          Show all
        </ToggleGroupItem>
        <ToggleGroupItem value="errors" className="px-2 py-1 h-7 text-xs">
          Errors only
        </ToggleGroupItem>
      </ToggleGroup>

      {dateLabel !== null && (
        <Button
          variant="outline"
          size="tiny"
          className="h-7"
          iconRight={<X size={14} strokeWidth={1.5} />}
          onClick={onClearDate}
        >
          {dateLabel}
        </Button>
      )}
    </div>
  )
}
