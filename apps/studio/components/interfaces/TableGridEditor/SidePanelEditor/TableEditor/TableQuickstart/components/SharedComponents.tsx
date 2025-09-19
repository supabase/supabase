import { memo } from 'react'
import { ArrowLeft, Columns3, X } from 'lucide-react'
import { Button, cn } from 'ui'
import type { TableSuggestion } from '../types'

export const BackButton = memo(
  ({
    onClick,
    disabled = false,
    label = 'Back',
  }: {
    onClick: () => void
    disabled?: boolean
    label?: string
  }) => (
    <Button
      type="text"
      size="tiny"
      icon={<ArrowLeft size={14} />}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} to previous view`}
    >
      {label}
    </Button>
  )
)
BackButton.displayName = 'BackButton'

export const SelectorHeader = memo(({ onDismiss }: { onDismiss?: () => void }) => (
  <div className="flex items-center justify-between">
    <label className="text-sm text-foreground-light">Start from template (optional)</label>
    {onDismiss && (
      <Button
        type="text"
        size="tiny"
        icon={<X size={14} />}
        onClick={onDismiss}
        className="text-foreground-lighter hover:text-foreground"
        aria-label="Dismiss template selector"
      >
        Dismiss
      </Button>
    )}
  </div>
))
SelectorHeader.displayName = 'SelectorHeader'

export const TemplateItem = memo(
  ({
    template,
    isSelected,
    onClick,
  }: {
    template: TableSuggestion
    isSelected: boolean
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-3 rounded-md border transition-all w-full',
        isSelected
          ? 'border-foreground bg-surface-200'
          : 'border-default hover:border-foreground-muted hover:bg-surface-100'
      )}
      data-selected={isSelected}
      aria-label={`Select ${template.tableName} table template`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium">{template.tableName}</div>
          {template.rationale && (
            <div className="text-xs text-foreground-light mt-1">{template.rationale}</div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-foreground-muted ml-3">
          <Columns3 size={12} aria-hidden="true" />
          <span>{template.fields.length}</span>
        </div>
      </div>
    </button>
  )
)
TemplateItem.displayName = 'TemplateItem'

export const TemplateList = memo(
  ({
    templates,
    selectedTemplate,
    onSelectTemplate,
  }: {
    templates: TableSuggestion[]
    selectedTemplate: TableSuggestion | null
    onSelectTemplate: (template: TableSuggestion) => void
  }) => (
    <div className="grid gap-2" role="list">
      {templates.map((template) => (
        <TemplateItem
          key={template.tableName}
          template={template}
          isSelected={selectedTemplate?.tableName === template.tableName}
          onClick={() => onSelectTemplate(template)}
        />
      ))}
    </div>
  )
)
TemplateList.displayName = 'TemplateList'
