import { useState, useCallback, useRef, useEffect } from 'react'
import { Wand2, ChevronDown, ArrowLeft, Database } from 'lucide-react'
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
import type { TableSuggestion } from './types'
import type { ColumnField } from '../../SidePanelEditor.types'
import type { TableField } from '../TableEditor.types'

interface TableTemplateSelectorProps {
  variant: 'ai' | 'templates'
  onSelectTemplate: (tableField: Partial<TableField>) => void
  disabled?: boolean
}

export const TableTemplateSelector = ({ variant, onSelectTemplate, disabled }: TableTemplateSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showAIInput, setShowAIInput] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatedTables, setGeneratedTables] = useState<TableSuggestion[]>([])
  const [selectedTableIndex, setSelectedTableIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TableSuggestion | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { generateTables, isGenerating } = useAITableGeneration()

  useEffect(() => {
    if (showAIInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAIInput])

  const applyTemplate = useCallback((table: TableSuggestion) => {
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

    onSelectTemplate({
      name: table.tableName,
      comment: table.rationale || '',
      columns,
    })

    setSelectedTemplate(table)
  }, [onSelectTemplate])

  const handleGenerateTables = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return

    try {
      const tables = await generateTables(aiPrompt)
      setGeneratedTables(tables)
      setSelectedTableIndex(0)
      if (tables.length > 0) {
        applyTemplate(tables[0])
      }
    } catch (error) {
      setShowAIInput(false)
      setIsOpen(false)
    }
  }, [aiPrompt, generateTables, isGenerating, applyTemplate])

  const handleQuickTemplate = useCallback((example: string) => {
    setAiPrompt(example)
    setShowAIInput(true)
    handleGenerateTables()
  }, [handleGenerateTables])

  const handleBack = useCallback(() => {
    setShowAIInput(false)
    setGeneratedTables([])
    setAiPrompt('')
    setSelectedTableIndex(0)
    setSelectedCategory(null)
    setSelectedTemplate(null)
  }, [])

  if (variant === 'templates') {
    return (
      <div className="space-y-2">
        <label className="text-sm text-foreground-light">Start from template (optional)</label>

        {!selectedCategory && !selectedTemplate && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                size="small"
                disabled={disabled}
                className="w-full justify-between"
                iconRight={<ChevronDown size={16} />}
              >
                <span className="flex items-center gap-2">
                  <Database size={14} />
                  Select from templates
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[320px]">
              {Object.keys(tableTemplates).map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category)
                    setIsOpen(false)
                  }}
                >
                  <Database size={14} className="mr-2" />
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {selectedCategory && !selectedTemplate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                type="text"
                size="tiny"
                icon={<ArrowLeft size={14} />}
                onClick={handleBack}
              >
                Back
              </Button>
              <span className="text-xs text-foreground-light">{selectedCategory}</span>
            </div>
            <div className="grid gap-2">
              {tableTemplates[selectedCategory].map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className="text-left p-3 rounded-md border border-default hover:border-foreground-muted transition-colors"
                >
                  <div className="text-sm font-medium">{template.tableName}</div>
                  <div className="text-xs text-foreground-light mt-1">{template.rationale}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTemplate && (
          <div className="space-y-2">
            <Button
              type="text"
              size="tiny"
              icon={<ArrowLeft size={14} />}
              onClick={handleBack}
            >
              Select another template
            </Button>
            <div className="rounded-md border border-default bg-surface-100 p-3">
              <div className="text-sm font-medium text-foreground">
                {selectedTemplate.tableName}
              </div>
              {selectedTemplate.rationale && (
                <div className="text-xs text-foreground-light mt-1">
                  {selectedTemplate.rationale}
                </div>
              )}
              <div className="text-xs text-foreground-muted mt-2">
                {selectedTemplate.fields.length} columns
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // AI Variant
  return (
    <div className="space-y-2">
      <label className="text-sm text-foreground-light">Start from template (optional)</label>

      {!showAIInput && generatedTables.length === 0 && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              size="small"
              disabled={disabled}
              className="w-full justify-between"
              iconRight={<ChevronDown size={16} />}
            >
              <span className="flex items-center gap-2">
                <Wand2 size={14} />
                Generate with AI
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            <DropdownMenuItem
              onClick={() => {
                setShowAIInput(true)
                setIsOpen(false)
              }}
            >
              <Wand2 size={14} className="mr-2" />
              Generate with AI...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-foreground-light">Quick ideas</div>
            {[
              'Social media platform',
              'E-commerce marketplace',
              'Project management tool',
              'Content management system',
            ].map((example) => (
              <DropdownMenuItem
                key={example}
                onClick={() => {
                  setIsOpen(false)
                  handleQuickTemplate(example)
                }}
              >
                {example}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showAIInput && generatedTables.length === 0 && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="text"
              size="tiny"
              icon={<ArrowLeft size={14} />}
              onClick={handleBack}
              disabled={isGenerating}
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
            actions={
              <Button
                type="default"
                size="tiny"
                disabled={!aiPrompt.trim() || isGenerating}
                onClick={handleGenerateTables}
                loading={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            }
          />
        </div>
      )}

      {generatedTables.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button
              type="text"
              size="tiny"
              icon={<ArrowLeft size={14} />}
              onClick={handleBack}
            >
              Generate new
            </Button>
            {generatedTables.length > 1 && (
              <div className="flex gap-1">
                {generatedTables.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedTableIndex(index)
                      applyTemplate(generatedTables[index])
                    }}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === selectedTableIndex
                        ? 'bg-foreground'
                        : 'bg-border hover:bg-foreground-muted'
                    )}
                    aria-label={`Select table ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="rounded-md border border-default bg-surface-100 p-3">
            <div className="text-sm font-medium text-foreground">
              {generatedTables[selectedTableIndex].tableName}
            </div>
            {generatedTables[selectedTableIndex].rationale && (
              <div className="text-xs text-foreground-light mt-1">
                {generatedTables[selectedTableIndex].rationale}
              </div>
            )}
            <div className="text-xs text-foreground-muted mt-2">
              {generatedTables[selectedTableIndex].fields.length} columns generated
            </div>
          </div>
        </div>
      )}
    </div>
  )
}