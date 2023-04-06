import { Button, IconChevronDown, IconChevronUp } from '@supabase/ui'
import { IS_PLATFORM } from 'lib/constants'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'
import * as Tooltip from '@radix-ui/react-tooltip'

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
  const isUtilityPanelCollapsed = (snippet?.splitSizes?.[1] ?? 0) === 0

  const maximizeEditor = () => snap.collapseUtilityPanel(id)
  const restorePanelSize = () => snap.restoreUtilityPanel(id)

  if (!snippet) return null
  return isUtilityPanelCollapsed ? (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
        <Button
          as="span"
          type="text"
          size="tiny"
          shadow={false}
          onClick={restorePanelSize}
          icon={<IconChevronUp className="text-gray-1100" size="tiny" strokeWidth={2} />}
        />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-scale-100 py-1 px-2 leading-none shadow',
              'border border-scale-200',
            ].join(' ')}
          >
            <span className="text-xs text-scale-1200">Show results</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  ) : (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
        <Button
          as="span"
          type="text"
          size="tiny"
          shadow={false}
          onClick={maximizeEditor}
          icon={<IconChevronDown className="text-gray-1100" size="tiny" strokeWidth={2} />}
        />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-scale-100 py-1 px-2 leading-none shadow',
              'border border-scale-200',
            ].join(' ')}
          >
            <span className="text-xs text-scale-1200">Collapse results</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default UtilityActions
