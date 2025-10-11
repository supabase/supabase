import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useAITableGeneration } from './useAITableGeneration'
import { tableTemplates } from './templates'
import { QuickstartVariant, ViewMode } from './types'
import { convertTableSuggestionToTableField } from './utils'
import { InitialView } from './components/InitialView'
import { CategoryView } from './components/CategoryView'
import { AIInputView } from './components/AIInputView'
import { ResultsView } from './components/ResultsView'
import type { TableSuggestion } from './types'
import type { TableField } from '../TableEditor.types'

interface TableTemplateSelectorProps {
  variant: Exclude<QuickstartVariant, QuickstartVariant.CONTROL> 
  onSelectTemplate: (tableField: Partial<TableField>) => void
  onDismiss?: () => void
  disabled?: boolean
}

const SUCCESS_MESSAGE_DURATION_MS = 3000

interface ViewState {
  mode: ViewMode
  selectedCategory: string | null
  selectedTemplate: TableSuggestion | null
  generatedTables: TableSuggestion[]
  isLoading: boolean
}

const initialViewState: ViewState = {
  mode: ViewMode.INITIAL,
  selectedCategory: null,
  selectedTemplate: null,
  generatedTables: [],
  isLoading: false,
}

export const TableTemplateSelector = ({
  variant,
  onSelectTemplate,
  onDismiss,
  disabled,
}: TableTemplateSelectorProps) => {
  const [viewState, setViewState] = useState<ViewState>(initialViewState)
  const [aiPrompt, setAiPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { generateTables, isGenerating, error: apiError } = useAITableGeneration()

  // Focus management
  useEffect(() => {
    if (viewState.mode === ViewMode.AI_INPUT && inputRef.current) {
      inputRef.current.focus()
    }
  }, [viewState.mode])

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setViewState((prev) => ({ ...prev, selectedTemplate: template }))
      toast.success(
        `${template.tableName} template applied. You can add or modify the fields below.`,
        {
          duration: SUCCESS_MESSAGE_DURATION_MS,
        }
      )
    },
    [onSelectTemplate]
  )

  const handleGenerateTables = useCallback(async (promptOverride?: string) => {
    const promptToUse = promptOverride ?? aiPrompt
    if (!promptToUse.trim() || isGenerating) return

    setViewState((prev) => ({ ...prev, isLoading: true }))

    try {
      const tables = await generateTables(promptToUse)

      if (tables.length > 0) {
        setViewState({
          mode: ViewMode.AI_RESULTS,
          selectedCategory: null,
          selectedTemplate: tables[0],
          generatedTables: tables,
          isLoading: false,
        })
        handleSelectTemplate(tables[0])
      } else {
        setViewState((prev) => ({
          ...prev,
          isLoading: false,
        }))
      }
    } catch (error) {
      setViewState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    }
  }, [aiPrompt, generateTables, isGenerating, handleSelectTemplate])

  const handleQuickIdea = useCallback(
    (idea: string) => {
      setAiPrompt(idea)
      setViewState((prev) => ({ ...prev, mode: ViewMode.AI_INPUT }))
      handleGenerateTables(idea)
    },
    [handleGenerateTables]
  )

  const handleCategorySelect = useCallback((category: string) => {
    setViewState((prev) => ({
      ...prev,
      mode: ViewMode.CATEGORY_SELECTED,
      selectedCategory: category,
    }))
  }, [])

  const handleAISelect = useCallback(() => {
    setViewState((prev) => ({ ...prev, mode: ViewMode.AI_INPUT }))
  }, [])

  const handleBack = useCallback(() => {
    setViewState(initialViewState)
    setAiPrompt('')
  }, [])

  const { mode, selectedCategory, selectedTemplate, generatedTables } = viewState

  // Initial view
  if (mode === ViewMode.INITIAL) {
    return (
      <InitialView
        variant={variant}
        disabled={disabled}
        onDismiss={onDismiss}
        onCategorySelect={handleCategorySelect}
        onAISelect={handleAISelect}
        onQuickIdea={handleQuickIdea}
      />
    )
  }

  // Category selection view
  if (mode === ViewMode.CATEGORY_SELECTED && selectedCategory) {
    const templates = tableTemplates[selectedCategory] ?? []
    return (
      <CategoryView
        category={selectedCategory}
        templates={templates}
        selectedTemplate={selectedTemplate}
        onBack={handleBack}
        onSelectTemplate={handleSelectTemplate}
      />
    )
  }

  // AI input view
  if (mode === ViewMode.AI_INPUT) {
    return (
      <AIInputView
        prompt={aiPrompt}
        error={apiError}
        isGenerating={isGenerating}
        isLoading={viewState.isLoading}
        inputRef={inputRef}
        onBack={handleBack}
        onPromptChange={setAiPrompt}
        onGenerate={handleGenerateTables}
      />
    )
  }

  // AI results view
  if (mode === ViewMode.AI_RESULTS && generatedTables.length > 0) {
    return (
      <ResultsView
        tables={generatedTables}
        selectedTemplate={selectedTemplate}
        title="AI Generated Tables"
        onBack={handleBack}
        onSelectTemplate={handleSelectTemplate}
      />
    )
  }

  return null
}
