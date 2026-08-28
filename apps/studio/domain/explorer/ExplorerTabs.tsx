import { RegistryContext, useAtom, useAtomValue } from '@effect/atom-react'
import { Match, Option } from 'effect'
import { Plus, X } from 'lucide-react'
import { useContext } from 'react'
import { Button } from 'ui'

import { explorerTabs, type ExplorerTab } from './explorer.tabs'

const getTabLabel = (tab: ExplorerTab) =>
  Match.value(tab).pipe(
    Match.tagsExhaustive({
      QueryTab: () => 'Query',
      NotebookTab: (tab) => tab.label,
      ChatTab: (tab) => tab.label,
    })
  )

export const ExplorerTabs = () => {
  const tabs = useAtomValue(explorerTabs.tabsAtom)
  const [currentTabId, setCurrentTabId] = useAtom(explorerTabs.currentTabAtom)
  const registry = useContext(RegistryContext)

  return (
    <div className="flex items-center border-b">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={Option.contains(currentTabId, tab.id)}
          className="flex items-center gap-1 border-r px-3 py-1.5 text-sm text-foreground-light aria-selected:bg-surface-300 aria-selected:text-foreground"
          onClick={() => setCurrentTabId(tab.id)}
          onDoubleClick={() => explorerTabs.persistTab(registry, tab.id)}
        >
          {getTabLabel(tab.data)}
          <Button
            variant="text"
            size="tiny"
            icon={<X size={12} />}
            aria-label={`Close ${getTabLabel(tab.data)}`}
            onClick={(e) => {
              e.stopPropagation()
              explorerTabs.closeTab(registry, tab.id)
            }}
          />
        </div>
      ))}
      <Button
        variant="text"
        size="tiny"
        icon={<Plus size={14} />}
        aria-label="New tab"
        onClick={() => explorerTabs.addTab(registry, { _tag: 'QueryTab' })}
      />
    </div>
  )
}
