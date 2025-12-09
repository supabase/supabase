import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AiIconAnimation,
  Button,
  Input_Shadcn_ as Input,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Columns3, Table2 } from 'lucide-react'
import type { TableField } from '../TableEditor.types'
import { AI_QUICK_IDEAS } from './constants'
import type { TableSuggestion } from './types'
import { useAITableGeneration } from './useAITableGeneration'
import { convertTableSuggestionToTableField } from './utils'
import { useTrack } from 'lib/telemetry/track'

interface QuickstartAIWidgetProps {
  onSelectTable: (tableData: Partial<TableField>) => void
  disabled?: boolean
}

const SUCCESS_MESSAGE_DURATION_MS = 3000

export const QuickstartAIWidget = ({ onSelectTable, disabled }: QuickstartAIWidgetProps) => {
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const track = useTrack()

  const {
    generateTables,
    isGenerating,
    error: apiError,
    prompt,
    tables: storedTables,
    setPrompt: setAiPrompt,
  } = useAITableGeneration()

  const aiPrompt = prompt ?? ''
  const tables = storedTables ?? []

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (aiPrompt && tables.length > 0) {
      setLastGeneratedPrompt(aiPrompt)
    }
  }, [])

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      track('table_quickstart_template_clicked', {
        tableName: template.tableName,
        columnCount: template.fields.length,
        source: 'ai',
      })

      const tableField = convertTableSuggestionToTableField(template)
      onSelectTable(tableField)
      toast.success(`Applied ${template.tableName} template. You can customize the fields below.`, {
        duration: SUCCESS_MESSAGE_DURATION_MS,
      })
    },
    [onSelectTable, track]
  )

  const handleGenerateTables = useCallback(
    async ({
      promptOverride,
      wasQuickIdea = false,
    }: { promptOverride?: string; wasQuickIdea?: boolean } = {}) => {
      const promptToUse = promptOverride ?? aiPrompt
      if (!promptToUse.trim() || isGenerating) return

      track('table_quickstart_ai_prompt_submitted', {
        promptLength: promptToUse.length,
        wasQuickIdea,
      })

      try {
        const tables = await generateTables(promptToUse)

        track('table_quickstart_ai_generation_completed', {
          success: tables.length > 0,
          tablesGenerated: tables.length,
          promptLength: promptToUse.length,
        })

        setLastGeneratedPrompt(promptToUse)
      } catch (error) {
        track('table_quickstart_ai_generation_completed', {
          success: false,
          tablesGenerated: 0,
          promptLength: promptToUse.length,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    [aiPrompt, generateTables, isGenerating, track]
  )

  const handleQuickIdea = useCallback(
    (idea: string) => {
      track('table_quickstart_quick_idea_clicked', {
        ideaText: idea,
      })

      setAiPrompt(idea)
      handleGenerateTables({ promptOverride: idea, wasQuickIdea: true })
    },
    [handleGenerateTables, setAiPrompt, track]
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
            {isGenerating
              ? 'Generating...'
              : aiPrompt === lastGeneratedPrompt && tables.length > 0
                ? 'Regenerate'
                : 'Generate'}
          </Button>
        </div>

        {apiError && (
          <div className="text-sm text-red-600" role="alert">
            {apiError}
          </div>
        )}

        {tables.length === 0 && (
          <div>
            <h4 className="text-xs text-foreground-light mb-2">Quick ideas:</h4>
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
            {tables.map((template) => (
              <button
                key={`ai:${template.tableName}`}
                onClick={() => handleSelectTemplate(template)}
                disabled={disabled}
                aria-label={`Select ${template.tableName} template with ${template.fields.length} fields`}
                className={cn(
                  'text-left p-3 rounded-md border transition-colors w-full bg-surface-100',
                  'border-light hover:border-default hover:bg-surface-200 cursor-pointer',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-alternative border w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Table2 size={16} className="text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground mb-0">
                      {template.tableName}
                    </div>
                    {template.rationale && (
                      <div className="text-xs text-foreground-light mt-0.5">
                        {template.rationale}
                      </div>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm text-foreground-muted ml-3">
                        <Columns3 size={14} aria-hidden="true" />
                        <span>{template.fields.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {template.fields.length} {template.fields.length === 1 ? 'column' : 'columns'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
