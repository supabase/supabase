import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import { Button, IconChevronDown, IconChevronUp } from 'ui'

const SizeToggleButton = () => {
  const sqlEditorStore: any = useSqlStore()

  function maximizeEditor() {
    sqlEditorStore.activeTab.collapseUtilityTab()
  }

  function restorePanelSize() {
    sqlEditorStore.activeTab.restorePanelSize()
  }

  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
        <>
          {sqlEditorStore.activeTab.utilityTabHeight !== 0 && (
            <Button
              type="text"
              size="tiny"
              className="px-1"
              shadow={false}
              onClick={maximizeEditor}
              icon={<IconChevronDown className="text-gray-1100" size="tiny" strokeWidth={2} />}
            />
          )}
          {sqlEditorStore.activeTab.utilityTabHeight === 0 && (
            <Button
              type="text"
              size="tiny"
              className="px-1"
              shadow={false}
              onClick={restorePanelSize}
              icon={<IconChevronUp className="text-gray-1100" size="tiny" strokeWidth={2} />}
            />
          )}
        </>
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
            <span className="text-xs text-scale-1200">
              {sqlEditorStore.activeTab.utilityTabHeight === 0
                ? 'Show results panel'
                : 'Hide results panel'}
            </span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default observer(SizeToggleButton)
