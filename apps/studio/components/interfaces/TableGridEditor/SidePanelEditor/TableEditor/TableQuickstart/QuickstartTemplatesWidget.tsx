import { Columns3, Layers } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import type { TableField } from '../TableEditor.types'
import { tableTemplates } from './templates'
import type { TableSuggestion } from './types'
import { convertTableSuggestionToTableField } from './utils'

interface QuickstartTemplatesWidgetProps {
  onSelectTemplate: (tableData: Partial<TableField>) => void
  disabled?: boolean
}

const SUCCESS_MESSAGE_DURATION_MS = 3000
const CATEGORIES = Object.keys(tableTemplates)

export const QuickstartTemplatesWidget = ({
  onSelectTemplate,
  disabled,
}: QuickstartTemplatesWidgetProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TableSuggestion | null>(null)

  useEffect(() => {
    if (activeCategory === null && CATEGORIES.length > 0) {
      setActiveCategory(CATEGORIES[0])
    }
  }, [activeCategory])

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setSelectedTemplate(template)
      toast.success(`Applied ${template.tableName} template. You can customize the fields below.`, {
        duration: SUCCESS_MESSAGE_DURATION_MS,
      })
    },
    [onSelectTemplate]
  )

  const displayedTemplates = activeCategory ? tableTemplates[activeCategory] || [] : []

  return (
    <div className="rounded-lg border border-default bg-surface-75 p-6 transition-all hover:border-foreground-muted">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={16} className="text-foreground" />
          <h3 className="text-base font-medium">Start with a table template</h3>
        </div>
        <p className="text-sm text-foreground-lighter">
          Select a pre-built schema to get started quickly.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              disabled={disabled}
              role="tab"
              aria-selected={activeCategory === category}
              aria-label={`${category} templates category`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm capitalize border transition-all',
                activeCategory === category
                  ? 'border-foreground bg-surface-200 text-foreground'
                  : 'border-default hover:border-foreground-muted hover:bg-surface-100 text-foreground-light',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {displayedTemplates.length > 0 && (
          <div className="grid gap-2 pt-1">
            {displayedTemplates.map((template) => (
              <button
                key={`${activeCategory}:${template.tableName}`}
                onClick={() => handleSelectTemplate(template)}
                disabled={disabled}
                aria-label={`Select ${template.tableName} template with ${template.fields.length} fields`}
                aria-pressed={selectedTemplate?.tableName === template.tableName}
                className={cn(
                  'text-left p-3 rounded-md border transition-all w-full',
                  selectedTemplate?.tableName === template.tableName
                    ? 'border-foreground bg-surface-200'
                    : 'border-default hover:border-foreground-muted hover:bg-surface-100',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium font-mono">{template.tableName}</div>
                    {template.rationale && (
                      <div className="text-sm text-foreground-light mt-1">{template.rationale}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-foreground-muted ml-3">
                    <Columns3 size={14} aria-hidden="true" />
                    <span>{template.fields.length}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
