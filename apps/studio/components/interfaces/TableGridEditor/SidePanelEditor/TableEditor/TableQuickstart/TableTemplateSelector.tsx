import { useState, useCallback } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Button, cn } from 'ui'
import { tableTemplates } from './templates'
import { QuickstartVariant } from './types'
import { convertTableSuggestionToTableField } from './utils'
import type { TableSuggestion } from './types'
import type { TableField } from '../TableEditor.types'

interface TableTemplateSelectorProps {
  variant: Exclude<QuickstartVariant, QuickstartVariant.CONTROL>
  onSelectTemplate: (tableField: Partial<TableField>) => void
  onDismiss?: () => void
  disabled?: boolean
}

export const TableTemplateSelector = ({
  variant,
  onSelectTemplate,
  onDismiss,
  disabled,
}: TableTemplateSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TableSuggestion | null>(null)

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setSelectedTemplate(template)
    },
    [onSelectTemplate]
  )

  const handleBack = useCallback(() => {
    setSelectedCategory(null)
    setSelectedTemplate(null)
  }, [])

  const categories = Object.keys(tableTemplates)

  // Category selection view
  if (!selectedCategory) {
    return (
      <div className="rounded-lg border border-default bg-surface-75 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Quick start with a template</h3>
            <p className="text-xs text-foreground-lighter mt-1">
              Choose a category to explore pre-built table templates
            </p>
          </div>
          {onDismiss && (
            <Button type="text" size="tiny" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              disabled={disabled}
              className={cn(
                'text-left p-3 rounded-md border transition-colors',
                'border-default hover:border-foreground-muted hover:bg-surface-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm capitalize">{category}</span>
                <ChevronRight size={14} className="text-foreground-muted" />
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Template selection view
  const templates = tableTemplates[selectedCategory] || []

  return (
    <div className="rounded-lg border border-default bg-surface-75 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="tiny"
            icon={<ArrowLeft size={14} />}
            onClick={handleBack}
            disabled={disabled}
          >
            Back
          </Button>
          <div className="text-sm">
            <span className="text-foreground-lighter">Category: </span>
            <span className="capitalize">{selectedCategory}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        {templates.map((template) => (
          <button
            key={template.tableName}
            onClick={() => handleSelectTemplate(template)}
            disabled={disabled}
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
                <div className="text-sm font-medium">{template.tableName}</div>
                {template.rationale && (
                  <div className="text-xs text-foreground-light mt-1">{template.rationale}</div>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-foreground-muted ml-3">
                <span>{template.fields.length} columns</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
