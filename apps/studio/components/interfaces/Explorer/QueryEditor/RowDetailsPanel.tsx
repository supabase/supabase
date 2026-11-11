import { DatabaseRowDetails, type RowDetailsProps } from '../Details/RowDetails'

/**
 * Sidebar view of the row selected in the results. The row's heading carries the way back to
 * the table it came from and, where the row can be edited, the full row form.
 */
export const RowDetailsPanel = (details: RowDetailsProps & { onBack: () => void }) => (
  <aside aria-label="Row details" className="h-full overflow-y-auto">
    <DatabaseRowDetails {...details} />
  </aside>
)
