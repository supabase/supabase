import { Badge, Checkbox } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { type QueryCellSummary } from './notebook.utils'

export type PendingQueryMatches = {
  destructiveQueries: QueryCellSummary[]
  mutatingQueries: QueryCellSummary[]
}

interface RunNotebookConfirmationModalProps {
  pendingQueryMatches: PendingQueryMatches | null
  skipMutatingCells: boolean
  onSkipMutatingCellsChange: (value: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

/** Asks before running a notebook whose query cells write to data or schema. */
export const RunNotebookConfirmationModal = ({
  pendingQueryMatches,
  skipMutatingCells,
  onSkipMutatingCellsChange,
  onCancel,
  onConfirm,
}: RunNotebookConfirmationModalProps) => (
  <ConfirmationModal
    size="small"
    visible={pendingQueryMatches !== null}
    title="Confirm to run notebook"
    confirmLabel={skipMutatingCells ? 'Run read-only cells' : 'Run all cells'}
    variant="warning"
    onCancel={onCancel}
    onConfirm={onConfirm}
  >
    <p className="text-sm">
      This notebook has {pendingQueryMatches?.mutatingQueries.length ?? 0}{' '}
      {pendingQueryMatches?.mutatingQueries.length === 1 ? 'query' : 'queries'} that{' '}
      {pendingQueryMatches?.mutatingQueries.length === 1 ? 'modifies' : 'modify'} data or schema and
      cannot be undone once run:
    </p>
    <ul className="text-sm list-disc pl-4 mt-2">
      {pendingQueryMatches?.mutatingQueries.map((cell) => (
        <li key={cell.id} className="flex items-center gap-2">
          {cell.title}
          {pendingQueryMatches.destructiveQueries.some(({ id }) => id === cell.id) && (
            <Badge variant="destructive">Destructive</Badge>
          )}
        </li>
      ))}
    </ul>
    <FormItemLayout
      isReactForm={false}
      layout="flex"
      id="skipMutatingCells"
      label="Skip these queries"
      description="Run only the read-only cells in this notebook"
      className="mt-4 [&>div:first-child>button]:translate-y-0.5"
    >
      <Checkbox
        id="skipMutatingCells"
        checked={skipMutatingCells}
        onCheckedChange={(value) => onSkipMutatingCellsChange(!!value)}
      />
    </FormItemLayout>
  </ConfirmationModal>
)
