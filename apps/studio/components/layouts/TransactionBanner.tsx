import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button, cn } from 'ui'

export const TransactionBanner = ({ sticky = false }: { sticky?: boolean }) => {
  const tableEditorSnap = useTableEditorStateSnapshot()

  if (!tableEditorSnap.isTestMode) return null

  return (
    <div
      className={cn(
        'flex items-center gap-x-3 bg-warning py-2 px-3 text-warning-100',
        sticky && 'sticky top-0 z-10'
      )}
    >
      <p className="text-xs flex-1">
        You are in test mode. Any data changes you make will be rolled back immediately.
      </p>
      <Button
        type="text"
        size="tiny"
        className="bg-warning-400 text-xs"
        onClick={() => tableEditorSnap.setIsTestMode(false)}
      >
        Switch off test mode
      </Button>
    </div>
  )
}
