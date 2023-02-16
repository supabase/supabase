import { observer } from 'mobx-react-lite'
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
    <>
      {sqlEditorStore.activeTab.utilityTabHeight != 0 && (
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
      )}
      {sqlEditorStore.activeTab.utilityTabHeight == 0 && (
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
      )}
    </>
  )
}

export default observer(SizeToggleButton)
