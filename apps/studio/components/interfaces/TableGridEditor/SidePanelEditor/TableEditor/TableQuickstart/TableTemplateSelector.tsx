import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button, cn } from 'ui'
import { tableTemplates } from './templates'
import { QuickstartVariant } from './types'
import { convertTableSuggestionToTableField } from './utils'
import type { TableSuggestion } from './types'
import type { TableField } from '../TableEditor.types'

interface TableTemplateSelectorProps {
  variant: Exclude<QuickstartVariant, QuickstartVariant.CONTROL> // [Sean] this will be used in PR #38934
  onSelectTemplate: (tableField: Partial<TableField>) => void
  onDismiss?: () => void
  disabled?: boolean
}

export const TableTemplateSelector = ({
  variant: _variant,
  onSelectTemplate,
  onDismiss,
  disabled,
}: TableTemplateSelectorProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null) // null => All
  const [selectedTemplate, setSelectedTemplate] = useState<TableSuggestion | null>(null)

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setSelectedTemplate(template)
    },
    [onSelectTemplate]
  )

  const categories = useMemo(() => Object.keys(tableTemplates), [])

  useEffect(() => {
    if (activeCategory === null && categories.length > 0) {
      setActiveCategory(categories[0])
    }
  }, [categories, activeCategory])

  const displayed = useMemo(
    () => (activeCategory ? tableTemplates[activeCategory] || [] : []),
    [activeCategory]
  )

  return (
    <div className="rounded-lg border border-default bg-surface-75 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">Quickstart: choose a template</h3>
          <p className="text-xs text-foreground-lighter mt-1">
            Pick a table template and pre-fill the editor
          </p>
        </div>
        {onDismiss && (
          <Button type="text" size="tiny" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            disabled={disabled}
            className={cn(
              'px-2 py-1 rounded-md text-xs capitalize border',
              activeCategory === category
                ? 'border-foreground bg-surface-200'
                : 'border-default hover:border-foreground-muted hover:bg-surface-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {displayed.map((t) => (
          <button
            key={`${activeCategory}:${t.tableName}`}
            onClick={() => handleSelectTemplate(t)}
            disabled={disabled}
            className={cn(
              'text-left p-3 rounded-md border transition-all w-full',
              selectedTemplate?.tableName === t.tableName
                ? 'border-foreground bg-surface-200'
                : 'border-default hover:border-foreground-muted hover:bg-surface-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium">{t.tableName}</div>
                {activeCategory && (
                  <div className="text-[11px] text-foreground-muted mt-0.5 capitalize">
                    {activeCategory}
                  </div>
                )}
                {t.rationale && (
                  <div className="text-xs text-foreground-light mt-1">{t.rationale}</div>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-foreground-muted ml-3">
                <span>{t.fields.length} columns</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
