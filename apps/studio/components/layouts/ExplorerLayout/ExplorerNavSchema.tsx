import { ChevronRight, Table2 } from 'lucide-react'

import { ExplorerNavPanel, rowClassName } from './ExplorerLayout.constants'
import { useOpenSchemaVisualizer } from '@/components/interfaces/Explorer/hooks'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const ExplorerNavSchema = ({
  schema,
  onSelectTables,
}: {
  schema: string
  onSelectTables: () => void
}) => {
  const { openSchemaVisualizer } = useOpenSchemaVisualizer()
  const tabs = useTabsStateSnapshot()
  const isVisualizerActive = tabs.activeTab === createTabId('schema', { schema })

  return (
    <ExplorerNavPanel label={schema}>
      <nav className="flex flex-col gap-px px-3 pb-3">
        <button
          type="button"
          tabIndex={0}
          className={rowClassName(isVisualizerActive)}
          onClick={() => openSchemaVisualizer(schema)}
        >
          <EntityTypeIcon type="schema" size={14} />
          <span className="flex-1 text-left">Schema Visualizer</span>
        </button>
        <button type="button" tabIndex={0} className={rowClassName(false)} onClick={onSelectTables}>
          <Table2 size={14} className="shrink-0" />
          <span className="flex-1 text-left">Tables</span>
          <ChevronRight size={14} className="shrink-0 text-foreground-muted" />
        </button>
      </nav>
    </ExplorerNavPanel>
  )
}
