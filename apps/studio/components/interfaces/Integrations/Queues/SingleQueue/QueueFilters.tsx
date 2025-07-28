import { FilterPopover } from 'components/ui/FilterPopover'
import { QUEUE_MESSAGE_OPTIONS, QUEUE_MESSAGE_TYPE } from './Queue.utils'

interface QueueFiltersProps {
  selectedTypes: QUEUE_MESSAGE_TYPE[]
  setSelectedTypes: (value: QUEUE_MESSAGE_TYPE[]) => void
}

export const QueueFilters = ({ selectedTypes, setSelectedTypes }: QueueFiltersProps) => {
  return (
    <div className="bg-surface-200 py-3 px-6 flex items-center justify-between border-t">
      <div className="flex items-center gap-x-2">
        <FilterPopover
          name={selectedTypes.length === 0 ? 'All types' : 'Types'}
          title="Select types to show"
          buttonType={selectedTypes.length === 0 ? 'dashed' : 'default'}
          options={QUEUE_MESSAGE_OPTIONS} // Ignore user image column
          labelKey="name"
          valueKey="id"
          labelClass="text-xs"
          maxHeightClass="h-[190px]"
          clearButtonText="Reset"
          activeOptions={selectedTypes}
          onSaveFilters={(value) => setSelectedTypes(value as any)}
        />
      </div>
    </div>
  )
}
