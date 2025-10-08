import { memo } from 'react'
import type { TableSuggestion } from '../types'
import { BackButton, TemplateList } from './SharedComponents'

interface ResultsViewProps {
  tables: TableSuggestion[]
  selectedTemplate: TableSuggestion | null
  title: string
  onBack: () => void
  onSelectTemplate: (template: TableSuggestion) => void
}

export const ResultsView = memo(
  ({ tables, selectedTemplate, title, onBack, onSelectTemplate }: ResultsViewProps) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack} label="Generate new" />
        <span className="text-xs text-foreground-light">{title}</span>
      </div>
      <div aria-live="polite">
        <TemplateList
          templates={tables}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
        />
      </div>
    </div>
  )
)

ResultsView.displayName = 'ResultsView'
