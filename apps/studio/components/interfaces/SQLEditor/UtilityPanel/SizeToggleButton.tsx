import * as Tooltip from '@radix-ui/react-tooltip'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button, IconMaximize2, IconMinimize2 } from 'ui'

export interface SizeToggleButton {
  id: string
}

const SizeToggleButton = ({ id }: SizeToggleButton) => {
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id]
  const isUtilityPanelCollapsed = (snippet?.splitSizes?.[1] ?? 0) === 0

  const maximizeEditor = () => snap.collapseUtilityPanel(id)
  const restorePanelSize = () => snap.restoreUtilityPanel(id)

  if (!snippet) return null
  return isUtilityPanelCollapsed ? (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>
        <Button
          type="text"
          size="tiny"
          onClick={restorePanelSize}
          icon={<IconMaximize2 className="text-gray-1100" size="tiny" strokeWidth={2} />}
        />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-alternative py-1 px-2 leading-none shadow',
              'border border-background',
            ].join(' ')}
          >
            <span className="text-xs text-foreground">Show results</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  ) : (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>
        <Button
          type="text"
          size="tiny"
          onClick={maximizeEditor}
          icon={<IconMinimize2 className="text-gray-1100" size="tiny" strokeWidth={2} />}
        />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-alternative py-1 px-2 leading-none shadow',
              'border border-background',
            ].join(' ')}
          >
            <span className="text-xs text-foreground">Collapse results</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default SizeToggleButton
