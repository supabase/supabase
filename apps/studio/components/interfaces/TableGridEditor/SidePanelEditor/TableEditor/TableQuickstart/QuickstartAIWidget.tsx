import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AiIconAnimation, Button, Input_Shadcn_ as Input, cn } from 'ui'
import { Columns3 } from 'lucide-react'
import type { TableField } from '../TableEditor.types'
import { AI_QUICK_IDEAS } from './constants'
import type { TableSuggestion } from './types'
import { useAITableGeneration } from './useAITableGeneration'
import { convertTableSuggestionToTableField } from './utils'

interface QuickstartAIWidgetProps {
  onSelectTable: (tableData: Partial<TableField>) => void
  disabled?: boolean
}

const SUCCESS_MESSAGE_DURATION_MS = 3000

export const QuickstartAIWidget = ({ onSelectTable, disabled }: QuickstartAIWidgetProps) => {
  const [aiPrompt, setAiPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    generateTables,
    isGenerating,
    error: apiError,
    tables,
    clearTables,
  } = useAITableGeneration()

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTable(tableField)
      toast.success(`Applied ${template.tableName} template. You can customize the fields below.`, {
        duration: SUCCESS_MESSAGE_DURATION_MS,
      })
    },
    [onSelectTable]
  )

  const handleGenerateTables = useCallback(
    async (promptOverride?: string) => {
      const promptToUse = promptOverride ?? aiPrompt
      if (!promptToUse.trim() || isGenerating) return

      await generateTables(promptToUse)
    },
    [aiPrompt, generateTables, isGenerating]
  )

  const handleQuickIdea = useCallback(
    (idea: string) => {
      setAiPrompt(idea)
      handleGenerateTables(idea)
    },
    [handleGenerateTables]
  )

  return (
    <div className="rounded-lg border border-default bg-surface-100 p-6 transition-all hover:border-foreground-muted">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AiIconAnimation size={16} loading={false} />
          <h3 className="text-base font-medium">Generate tables with AI</h3>
        </div>
        <p className="text-sm text-foreground-lighter">
          Describe your app and AI will create a complete table schema.
        </p>
      </div>

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
            icon={<AiIconAnimation loading={isGenerating} />}
            className="absolute right-1 top-1/2 -translate-y-1/2 !space-x-1"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>

        {apiError && (
          <div className="text-sm text-red-600" role="alert">
            {apiError}
          </div>
        )}

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
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-default',
                    'hover:border-foreground-muted hover:bg-surface-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all'
                  )}
                >
                  <AiIconAnimation size={12} />
                  <span>{idea}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tables.length > 0 && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between mt-1 mb-1">
              <span className="text-xs text-foreground-light">
                Generated {tables.length} table{tables.length !== 1 ? 's' : ''}
              </span>
              <Button
                type="text"
                size="tiny"
                onClick={() => {
                  clearTables()
                  setAiPrompt('')
                  if (inputRef.current) inputRef.current.focus()
                }}
                disabled={isGenerating}
                aria-label="Clear results and generate new tables"
              >
                Generate new
              </Button>
            </div>
            {tables.map((template) => (
              <button
                key={`ai:${template.tableName}`}
                onClick={() => handleSelectTemplate(template)}
                disabled={disabled}
                aria-label={`Select ${template.tableName} template with ${template.fields.length} fields`}
                className={cn(
                  'text-left p-3 rounded-md border transition-all w-full',
                  'border-default hover:border-foreground-muted hover:bg-surface-200',
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
