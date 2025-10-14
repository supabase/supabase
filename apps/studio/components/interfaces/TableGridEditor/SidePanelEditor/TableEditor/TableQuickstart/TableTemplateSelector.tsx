import { Columns3 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AiIconAnimation, Button, Input_Shadcn_ as Input, cn } from 'ui'
import type { TableField } from '../TableEditor.types'
import { AI_QUICK_IDEAS } from './constants'
import { tableTemplates } from './templates'
import type { TableSuggestion } from './types'
import { QuickstartVariant } from './types'
import { useAITableGeneration } from './useAITableGeneration'
import { convertTableSuggestionToTableField } from './utils'

interface TableTemplateSelectorProps {
  variant: Exclude<QuickstartVariant, QuickstartVariant.CONTROL>
  onSelectTemplate: (tableField: Partial<TableField>) => void
  onDismiss?: () => void
  disabled?: boolean
}

const SUCCESS_MESSAGE_DURATION_MS = 3000
const CATEGORIES = Object.keys(tableTemplates)

export const TableTemplateSelector = ({
  variant,
  onSelectTemplate,
  onDismiss,
  disabled,
}: TableTemplateSelectorProps) => {
  // State for `templates` variant
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TableSuggestion | null>(null)

  // State for `ai` variant
  const [aiPrompt, setAiPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    generateTables,
    isGenerating,
    error: apiError,
    tables,
    clearTables,
  } = useAITableGeneration()

  const isAI = variant === QuickstartVariant.AI

  // Auto-select first category for templates variant
  useEffect(() => {
    if (!isAI && activeCategory === null && CATEGORIES.length > 0) {
      setActiveCategory(CATEGORIES[0])
    }
  }, [CATEGORIES, activeCategory, isAI])

  // Focus AI input when in AI mode
  useEffect(() => {
    if (isAI && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAI])

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setSelectedTemplate(template)
      toast.success(
        `Applied ${template.tableName} template. You can customize the fields below.`,
        {
          duration: SUCCESS_MESSAGE_DURATION_MS,
        }
      )
    },
    [onSelectTemplate]
  )

  const handleGenerateTables = useCallback(
    async (promptOverride?: string) => {
      const promptToUse = promptOverride ?? aiPrompt
      if (!promptToUse.trim() || isGenerating) return

      const generated = await generateTables(promptToUse)

      if (generated.length > 0) {
        handleSelectTemplate(generated[0])
      }
    },
    [aiPrompt, generateTables, isGenerating, handleSelectTemplate]
  )

  const handleQuickIdea = useCallback(
    (idea: string) => {
      setAiPrompt(idea)
      handleGenerateTables(idea)
    },
    [handleGenerateTables]
  )

  const displayedTemplates = useMemo(() => {
    if (isAI) {
      return tables
    }
    return activeCategory ? tableTemplates[activeCategory] || [] : []
  }, [isAI, tables, activeCategory])

  return (
    <div className="rounded-lg border border-default bg-surface-75 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">
            {isAI ? 'Generate tables with AI' : 'Start faster with a table template'}
          </h3>
          <p className="text-xs text-foreground-lighter mt-1">
            {isAI
              ? "Describe your app and AI will create a complete table schema."
              : 'Select a pre-built schema to get started quickly.'}
          </p>
        </div>
        {onDismiss && (
          <Button type="text" size="tiny" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>

      {/* AI Variant: Input and Quick Ideas */}
      {isAI && (
        <div className="space-y-3">
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Describe your app (e.g., 'recipe sharing app')"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (aiPrompt.trim()) {
                    handleGenerateTables()
                  }
                }
              }}
              disabled={isGenerating || disabled}
              aria-label="Table description for AI generation"
              className="pr-24"
            />
            <Button
              type="default"
              size="tiny"
              disabled={!aiPrompt.trim() || isGenerating || disabled}
              onClick={() => handleGenerateTables()}
              icon={<AiIconAnimation />}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>

          {apiError && (
            <div className="text-sm text-red-600" role="alert">
              {apiError}
            </div>
          )}

          {/* Quick Ideas */}
          {tables.length === 0 && (
            <div>
              <div className="text-xs text-foreground-light mb-2">Quick ideas:</div>
              <div className="flex flex-wrap gap-2">
                {AI_QUICK_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    onClick={() => handleQuickIdea(idea)}
                    disabled={isGenerating || disabled}
                    aria-label={`Generate table for ${idea}`}
                    className={cn(
                      'px-2 py-1 rounded-md text-xs border border-default',
                      'hover:border-foreground-muted hover:bg-surface-100',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all'
                    )}
                  >
                    <AiIconAnimation size={12} className="inline mr-1" />
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Templates Variant: Category Tabs */}
      {!isAI && (
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              disabled={disabled}
              role="tab"
              aria-selected={activeCategory === category}
              aria-label={`${category} templates category`}
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
      )}

      {/* Templates List (both variants use this) */}
      {displayedTemplates.length > 0 && (
        <div className="grid gap-2">
          {isAI && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-light">
                Generated {tables.length} table{tables.length !== 1 ? 's' : ''}
              </span>
              <Button
                type="text"
                size="tiny"
                onClick={() => {
                  clearTables()
                  setSelectedTemplate(null)
                  setAiPrompt('')
                  if (inputRef.current) inputRef.current.focus()
                }}
                disabled={isGenerating}
                aria-label="Clear results and generate new tables"
              >
                Generate new
              </Button>
            </div>
          )}
          {displayedTemplates.map((template) => (
            <button
              key={`${isAI ? 'ai' : activeCategory}:${template.tableName}`}
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
  )
}
