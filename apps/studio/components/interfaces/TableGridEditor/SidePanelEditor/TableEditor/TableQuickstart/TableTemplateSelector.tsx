import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react'
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
import { QuickstartVariant } from './types'
import { STORAGE_KEYS, AI_QUICK_IDEAS, LIMITS } from './constants'
import type { TableSuggestion } from './types'
import type { ColumnField } from '../../SidePanelEditor.types'
import type { TableField } from '../TableEditor.types'

interface TableTemplateSelectorProps {
  variant: QuickstartVariant.AI | QuickstartVariant.TEMPLATES
  onSelectTemplate: (tableField: Partial<TableField>) => void
  onDismiss?: () => void
  disabled?: boolean
}

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
    onClick={onClick}
    className={cn(
      "text-left p-3 rounded-md border transition-all",
      isSelected
        ? "border-foreground bg-surface-200"
        : "border-default hover:border-foreground-muted hover:bg-surface-100"
    )}
    aria-pressed={isSelected}
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

const CategorySelector = memo(({
  onSelectCategory,
  onDismiss,
  disabled
}: {
  onSelectCategory: (category: string) => void
  onDismiss?: () => void
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const categories = useMemo(() => Object.keys(tableTemplates), [])

  return (
    <>
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
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
                onSelectCategory(category)
                setIsOpen(false)
              }}
            >
              <Database size={14} className="mr-2" aria-hidden="true" />
              {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
})
CategorySelector.displayName = 'CategorySelector'

export const TableTemplateSelector = ({
  variant,
  onSelectTemplate,
  onDismiss,
  disabled
}: TableTemplateSelectorProps) => {
  const [viewState, setViewState] = useState<{
    mode: 'initial' | 'ai-input' | 'ai-results' | 'category-selected'
    selectedCategory: string | null
    selectedTemplate: TableSuggestion | null
    generatedTables: TableSuggestion[]
  }>({
    mode: 'initial',
    selectedCategory: null,
    selectedTemplate: null,
    generatedTables: [],
  })

  const [aiPrompt, setAiPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { generateTables, isGenerating } = useAITableGeneration()

  useEffect(() => {
    if (viewState.mode === 'ai-input' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [viewState.mode])

  const convertToTableField = useCallback((table: TableSuggestion): Partial<TableField> => {
    const columns: ColumnField[] = table.fields.map((field, index) => {
      const isPrimaryKey = field.isPrimary === true || field.name === 'id'
      const looksLikeIdentity = field.name === 'id' && field.type.toLowerCase().includes('int') && !field.default
      const defaultValue = isPrimaryKey ? null : field.default ? String(field.default) : null

      return {
        id: `column-${index}`,
        name: field.name,
        format: field.type,
        defaultValue: defaultValue,
        isNullable: field.nullable !== false,
        isUnique: field.unique ?? false,
        isIdentity: looksLikeIdentity,
        isPrimaryKey: isPrimaryKey,
        comment: field.description || '',
        isNewColumn: true,
        table: table.tableName,
        schema: 'public',
        check: null,
        isArray: false,
        isEncrypted: false,
      }
    })

    return {
      name: table.tableName,
      comment: table.rationale || '',
      columns,
    }
  }, [])

  const handleSelectTemplate = useCallback((template: TableSuggestion) => {
    onSelectTemplate(convertToTableField(template))
    setViewState(prev => ({ ...prev, selectedTemplate: template }))
  }, [onSelectTemplate, convertToTableField])

  const handleGenerateTables = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return

    const tables = await generateTables(aiPrompt)
    if (tables.length > 0) {
      setViewState({
        mode: 'ai-results',
        selectedCategory: null,
        selectedTemplate: tables[0],
        generatedTables: tables,
      })
      handleSelectTemplate(tables[0])
    }
  }, [aiPrompt, generateTables, isGenerating, handleSelectTemplate])

  const handleReset = useCallback(() => {
    setViewState({
      mode: 'initial',
      selectedCategory: null,
      selectedTemplate: null,
      generatedTables: [],
    })
    setAiPrompt('')
  }, [])

  if (variant === QuickstartVariant.TEMPLATES) {
    if (viewState.selectedCategory && viewState.mode !== 'initial') {
      const templates = tableTemplates[viewState.selectedCategory] || []
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

    return (
      <div className="space-y-2">
        <CategorySelector
          onSelectCategory={(category) =>
            setViewState(prev => ({ ...prev, mode: 'category-selected', selectedCategory: category }))
          }
          onDismiss={onDismiss}
          disabled={disabled}
        />
      </div>
    )
  }

  if (viewState.mode === 'ai-input') {
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
          disabled={isGenerating}
          aria-label="Table description for AI generation"
          aria-describedby="ai-prompt-help"
          actions={
            <Button
              type="default"
              size="tiny"
              disabled={!aiPrompt.trim() || isGenerating}
              onClick={handleGenerateTables}
              loading={isGenerating}
              aria-label={isGenerating ? 'Generating tables' : 'Generate tables'}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          }
        />
        <span id="ai-prompt-help" className="sr-only">
          Enter a description of your tables and press Enter or click Generate
        </span>
      </div>
    )
  }

  if (viewState.mode === 'ai-results' && viewState.generatedTables.length > 0) {
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
        <div className="grid gap-2" role="list">
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

  return (
    <div className="space-y-2">
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
            onClick={() => setViewState(prev => ({ ...prev, mode: 'ai-input' }))}
          >
            <Wand2 size={14} className="mr-2" aria-hidden="true" />
            Generate with AI...
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-foreground-light">Quick ideas</div>
          {AI_QUICK_IDEAS.map((example) => (
            <DropdownMenuItem
              key={example}
              onClick={async () => {
                setAiPrompt(example)
                setViewState(prev => ({ ...prev, mode: 'ai-input' }))
                setTimeout(() => handleGenerateTables(), 100)
              }}
            >
              {example}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}