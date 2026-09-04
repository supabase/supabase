import { ChevronRight, Table2 } from 'lucide-react'
import { type ComponentType } from 'react'

import { ExplorerNavPanel, rowClassName, type ExplorerNavLevel } from './ExplorerLayout.constants'

/**
 * Database object kinds, in sidebar order. Tables ship first; functions, triggers and the
 * rest each add a row here plus the panel their level drills into.
 */
const DATABASE_SECTIONS: Array<{
  level: ExplorerNavLevel
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
}> = [{ level: 'database-tables', label: 'Tables', icon: Table2 }]

export const ExplorerNavDatabase = ({
  onBack,
  onSelectLevel,
}: {
  onBack: () => void
  onSelectLevel: (level: ExplorerNavLevel) => void
}) => {
  return (
    <ExplorerNavPanel label="Database" onBack={onBack}>
      <nav className="flex flex-col gap-px px-3 pb-3">
        {DATABASE_SECTIONS.map(({ level, label, icon: Icon }) => (
          <button
            key={level}
            type="button"
            tabIndex={0}
            className={rowClassName(false)}
            onClick={() => onSelectLevel(level)}
          >
            <Icon size={14} className="shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            <ChevronRight size={14} className="shrink-0 text-foreground-muted" />
          </button>
        ))}
      </nav>
    </ExplorerNavPanel>
  )
}
