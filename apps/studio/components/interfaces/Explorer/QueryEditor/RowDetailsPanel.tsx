import { ArrowLeftIcon } from 'lucide-react'
import { Button } from 'ui'

import { DatabaseRowDetails, type RowDetailsProps } from '../Details/RowDetails'

/**
 * Sidebar view of the row selected in the results, with a way back to the table it came
 * from and, where the row can be edited, the full row form.
 */
export const RowDetailsPanel = ({
  onBack,
  onEdit,
  ...details
}: RowDetailsProps & {
  onBack: () => void
  /** Present when the row can be edited. */
  onEdit?: () => void
}) => (
  <aside aria-label="Row details" className="flex h-full flex-col">
    <div className="flex h-10 shrink-0 items-center justify-between gap-x-2 border-b px-2">
      <Button
        variant="text"
        size="tiny"
        className="min-w-0"
        icon={<ArrowLeftIcon size={14} />}
        onClick={onBack}
      >
        <span className="truncate">{details.relation.name}</span>
      </Button>
      {onEdit && (
        <Button variant="default" size="tiny" onClick={onEdit}>
          Edit row
        </Button>
      )}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto">
      <DatabaseRowDetails {...details} />
    </div>
  </aside>
)
