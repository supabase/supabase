import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Wand2, ChevronDown, ArrowLeft, Database, Columns3, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Input,
  cn,
} from 'ui'
import { useAITableGeneration } from './useAITableGeneration'
import { tableTemplates } from './templates'
import { QuickstartVariant, ViewMode } from './types'
import { AI_QUICK_IDEAS } from './constants'
import { convertTableSuggestionToTableField } from './utils'
import type { TableSuggestion } from './types'
import type { TableField } from '../TableEditor.types'

interface TableTemplateSelectorProps {
  variant: Exclude<QuickstartVariant, QuickstartVariant.CONTROL>
  onSelectTemplate: (tableField: Partial<TableField>) => void
  onDismiss?: () => void
  disabled?: boolean
}

interface ViewState {
  mode: ViewMode
  selectedCategory: string | null
  selectedTemplate: TableSuggestion | null
  generatedTables: TableSuggestion[]
  error: string | null
  isLoading: boolean
}

const initialViewState: ViewState = {
  mode: ViewMode.INITIAL,
  selectedCategory: null,
  selectedTemplate: null,
  generatedTables: [],
  error: null,
  isLoading: false,
}

// Template item component
const TemplateItem = memo(({
  template,
  isSelected,
  onClick
}: {
  template: TableSuggestion
  isSelected: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "text-left p-3 rounded-md border transition-all w-full",
      isSelected
        ? "border-foreground bg-surface-200"
        : "border-default hover:border-foreground-muted hover:bg-surface-100"
    )}
    aria-selected={isSelected}
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
))
TemplateItem.displayName = 'TemplateItem'

// Header with dismiss button
const SelectorHeader = memo(({
  onDismiss
}: {
  onDismiss?: () => void
}) => (
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

export const TableTemplateSelector = ({
  variant,
  onSelectTemplate,
  onDismiss,
  disabled
}: TableTemplateSelectorProps) => {
  const [viewState, setViewState] = useState<ViewState>(initialViewState)
  const [aiPrompt, setAiPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { generateTables, isGenerating, error: apiError } = useAITableGeneration()

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Focus management
  useEffect(() => {
    if (viewState.mode === ViewMode.AI_INPUT && inputRef.current) {
      inputRef.current.focus()
    }
  }, [viewState.mode])

  // Update error state when API error changes
  useEffect(() => {
    if (apiError) {
      setViewState(prev => ({ ...prev, error: apiError }))
    }
  }, [apiError])

  const handleSelectTemplate = useCallback((template: TableSuggestion) => {
    const tableField = convertTableSuggestionToTableField(template)
    onSelectTemplate(tableField)
    setViewState(prev => ({ ...prev, selectedTemplate: template }))
  }, [onSelectTemplate])

  const handleGenerateTables = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return

    setViewState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const tables = await generateTables(aiPrompt)

      if (tables.length > 0) {
        setViewState({
          mode: ViewMode.AI_RESULTS,
          selectedCategory: null,
          selectedTemplate: tables[0],
          generatedTables: tables,
          error: null,
          isLoading: false,
        })
        handleSelectTemplate(tables[0])
      } else {
        setViewState(prev => ({
          ...prev,
          error: 'No tables generated. Please try a different description.',
          isLoading: false,
        }))
      }
    } catch (error) {
      setViewState(prev => ({
        ...prev,
        error: 'Failed to generate tables. Please try again.',
        isLoading: false,
      }))
    }
  }, [aiPrompt, generateTables, isGenerating, handleSelectTemplate])

  const handleQuickIdea = useCallback((idea: string) => {
    setAiPrompt(idea)
    setViewState(prev => ({ ...prev, mode: ViewMode.AI_INPUT }))

    // Clean up any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Auto-generate after setting the prompt
    timeoutRef.current = setTimeout(() => {
      handleGenerateTables()
      timeoutRef.current = null
    }, 100)
  }, [handleGenerateTables])

  const handleReset = useCallback(() => {
    setViewState(initialViewState)
    setAiPrompt('')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Template variant - category selected
  if (variant === QuickstartVariant.TEMPLATES && viewState.mode === ViewMode.CATEGORY_SELECTED && viewState.selectedCategory) {
    const templates = tableTemplates[viewState.selectedCategory] ?? []

    if (templates.length === 0) {
      return (
        <div className="space-y-2">
          <Button
            type="text"
            size="tiny"
            icon={<ArrowLeft size={14} />}
            onClick={handleReset}
            aria-label="Back to category selection"
          >
            Back
          </Button>
          <p className="text-sm text-foreground-lighter">No templates available for this category.</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button
            type="text"
            size="tiny"
            icon={<ArrowLeft size={14} />}
            onClick={handleReset}
            aria-label="Back to category selection"
          >
            Back
          </Button>
          <span className="text-xs text-foreground-light">{viewState.selectedCategory}</span>
        </div>
        <div className="grid gap-2" role="list">
          {templates.map((template) => (
            <TemplateItem
              key={template.tableName}
              template={template}
              isSelected={viewState.selectedTemplate?.tableName === template.tableName}
              onClick={() => handleSelectTemplate(template)}
            />
          ))}
        </div>
      </div>
    )
  }

  // Template variant - initial
  if (variant === QuickstartVariant.TEMPLATES && viewState.mode === ViewMode.INITIAL) {
    const categories = Object.keys(tableTemplates)

    return (
      <div className="space-y-2">
        <SelectorHeader onDismiss={onDismiss} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              size="small"
              disabled={disabled}
              className="w-full justify-between"
              iconRight={<ChevronDown size={16} />}
              aria-label="Select template category"
            >
              <span className="flex items-center gap-2">
                <Database size={14} aria-hidden="true" />
                Select from templates
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            {categories.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => {
                  setViewState(prev => ({
                    ...prev,
                    mode: ViewMode.CATEGORY_SELECTED,
                    selectedCategory: category
                  }))
                }}
              >
                <Database size={14} className="mr-2" aria-hidden="true" />
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // AI variant - input mode
  if (variant === QuickstartVariant.AI && viewState.mode === ViewMode.AI_INPUT) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="text"
            size="tiny"
            icon={<ArrowLeft size={14} />}
            onClick={handleReset}
            disabled={isGenerating}
            aria-label="Back to initial view"
          >
            Back
          </Button>
        </div>
        {viewState.error && (
          <div className="text-sm text-red-600" role="alert">
            {viewState.error}
          </div>
        )}
        <Input
          inputRef={inputRef}
          placeholder="Describe your table (e.g., 'user profiles with social features')"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleGenerateTables()
            }
          }}
          disabled={isGenerating || viewState.isLoading}
          aria-label="Table description for AI generation"
          aria-describedby="ai-prompt-help"
          actions={
            <Button
              type="default"
              size="tiny"
              disabled={!aiPrompt.trim() || isGenerating || viewState.isLoading}
              onClick={handleGenerateTables}
              loading={isGenerating || viewState.isLoading}
              aria-label={isGenerating ? 'Generating tables' : 'Generate tables'}
            >
              {isGenerating || viewState.isLoading ? 'Generating...' : 'Generate'}
            </Button>
          }
        />
        <span id="ai-prompt-help" className="sr-only">
          Enter a description of your tables and press Enter or click Generate
        </span>
      </div>
    )
  }

  // AI variant - results
  if (variant === QuickstartVariant.AI && viewState.mode === ViewMode.AI_RESULTS && viewState.generatedTables.length > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button
            type="text"
            size="tiny"
            icon={<ArrowLeft size={14} />}
            onClick={handleReset}
            aria-label="Generate new tables"
          >
            Generate new
          </Button>
          <span className="text-xs text-foreground-light">AI Generated Tables</span>
        </div>
        <div className="grid gap-2" role="list" aria-live="polite">
          {viewState.generatedTables.map((table) => (
            <TemplateItem
              key={table.tableName}
              template={table}
              isSelected={viewState.selectedTemplate?.tableName === table.tableName}
              onClick={() => handleSelectTemplate(table)}
            />
          ))}
        </div>
      </div>
    )
  }

  // Initial state - AI variant
  if (variant === QuickstartVariant.AI) {
    return (
      <div className="space-y-2">
        <SelectorHeader onDismiss={onDismiss} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              size="small"
              disabled={disabled}
              className="w-full justify-between"
              iconRight={<ChevronDown size={16} />}
              aria-label="Generate tables with AI"
            >
              <span className="flex items-center gap-2">
                <Wand2 size={14} aria-hidden="true" />
                Generate with AI
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            <DropdownMenuItem
              onClick={() => setViewState(prev => ({ ...prev, mode: ViewMode.AI_INPUT }))}
            >
              <Wand2 size={14} className="mr-2" aria-hidden="true" />
              Generate with AI...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-foreground-light">Quick ideas</div>
            {AI_QUICK_IDEAS.map((example) => (
              <DropdownMenuItem
                key={example}
                onClick={() => handleQuickIdea(example)}
              >
                {example}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Fallback for unknown state
  return null
}