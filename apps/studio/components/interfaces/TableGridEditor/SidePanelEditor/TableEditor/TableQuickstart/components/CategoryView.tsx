import { memo } from 'react'
import type { TableSuggestion } from '../types'
import { BackButton, TemplateList } from './SharedComponents'

interface CategoryViewProps {
  category: string
  templates: TableSuggestion[]
  selectedTemplate: TableSuggestion | null
  onBack: () => void
  onSelectTemplate: (template: TableSuggestion) => void
}

export const CategoryView = memo(
  ({ category, templates, selectedTemplate, onBack, onSelectTemplate }: CategoryViewProps) => {
    if (templates.length === 0) {
      return (
        <div className="space-y-2">
          <BackButton onClick={onBack} />
          <p className="text-sm text-foreground-lighter">
            No templates available for this category.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} />
          <span className="text-xs text-foreground-light">{category}</span>
        </div>
        <TemplateList
          templates={templates}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
        />
      </div>
    )
  }
)

CategoryView.displayName = 'CategoryView'
