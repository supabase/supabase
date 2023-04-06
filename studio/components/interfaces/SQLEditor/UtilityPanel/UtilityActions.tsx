import { Button, IconChevronDown, IconChevronUp } from '@supabase/ui'
import { IS_PLATFORM } from 'lib/constants'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  executeQuery?: (overrideSql?: string) => void
}

const UtilityActions = ({ id, isExecuting = false, executeQuery }: UtilityActionsProps) => {
  return (
    <>
      <SavingIndicator id={id} />
      {IS_PLATFORM && <FavoriteButton id={id} />}
      <SizeToggleButton id={id} />
      <Button
        onClick={() => executeQuery?.()}
        disabled={isExecuting}
        loading={isExecuting}
        type="text"
        size="tiny"
        shadow={false}
        className="mx-2"
      >
        RUN
      </Button>
    </>
  )
}
const SizeToggleButton = ({ id }: { id: string }) => {
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id]

  function maximizeEditor() {
    snap.collapseUtilityPanel(id)
  }

  function restorePanelSize() {
    snap.restoreUtilityPanel(id)
  }

  return snippet.utilityPanelCollapsed ? (
    <Button
      type="text"
      size="tiny"
      shadow={false}
      onClick={restorePanelSize}
      icon={<IconChevronUp className="text-gray-1100" size="tiny" strokeWidth={2} />}
      // @ts-ignore
      tooltip={{
        title: 'Restore panel size',
        position: 'top',
      }}
    />
  ) : (
    <Button
      type="text"
      size="tiny"
      shadow={false}
      onClick={maximizeEditor}
      icon={<IconChevronDown className="text-gray-1100" size="tiny" strokeWidth={2} />}
      // @ts-ignore
      tooltip={{
        title: 'Maximize editor',
        position: 'top',
      }}
    />
  )
}

export default UtilityActions
