import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAITableGeneration } from './useAITableGeneration'
import { tableTemplates } from './templates'
import { QuickstartVariant, ViewMode } from './types'
import { convertTableSuggestionToTableField } from './utils'
import { InitialView } from './components/InitialView'
import { CategoryView } from './components/CategoryView'
import { AIInputView } from './components/AIInputView'
import { ResultsView } from './components/ResultsView'
import { createViewConfig, type ViewKey } from './viewConfig'
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

export const TableTemplateSelector = ({
  variant,
  onSelectTemplate,
  onDismiss,
  disabled,
}: TableTemplateSelectorProps) => {
  const [viewState, setViewState] = useState<ViewState>(initialViewState)
  const [aiPrompt, setAiPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { generateTables, isGenerating, error: apiError } = useAITableGeneration()

  // Memoize view configuration
  const viewConfig = useMemo(() => createViewConfig(), [])

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
      setViewState((prev) => ({ ...prev, error: apiError }))
    }
  }, [apiError])

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setViewState((prev) => ({ ...prev, selectedTemplate: template }))
    },
    [onSelectTemplate]
  )

  const handleGenerateTables = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return

    setViewState((prev) => ({ ...prev, isLoading: true, error: null }))

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
        setViewState((prev) => ({
          ...prev,
          error: 'No tables generated. Please try a different description.',
          isLoading: false,
        }))
      }
    } catch (error) {
      setViewState((prev) => ({
        ...prev,
        error: 'Failed to generate tables. Please try again.',
        isLoading: false,
      }))
    }
  }, [aiPrompt, generateTables, isGenerating, handleSelectTemplate])

  const handleQuickIdea = useCallback(
    (idea: string) => {
      setAiPrompt(idea)
      setViewState((prev) => ({ ...prev, mode: ViewMode.AI_INPUT }))

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        handleGenerateTables()
        timeoutRef.current = null
      }, 100)
    },
    [handleGenerateTables]
  )

  const handleReset = useCallback(() => {
    setViewState(initialViewState)
    setAiPrompt('')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Handler collection for views
  const handlers = useMemo(
    () => ({
      onCategorySelect: (category: string) => {
        setViewState((prev) => ({
          ...prev,
          mode: ViewMode.CATEGORY_SELECTED,
          selectedCategory: category,
        }))
      },
      onAISelect: () => {
        setViewState((prev) => ({ ...prev, mode: ViewMode.AI_INPUT }))
      },
      onQuickIdea: handleQuickIdea,
      onBack: handleReset,
      onSelectTemplate: handleSelectTemplate,
      onPromptChange: setAiPrompt,
      onGenerate: handleGenerateTables,
    }),
    [handleQuickIdea, handleReset, handleSelectTemplate, handleGenerateTables]
  )

  // Get the appropriate view component
  const getView = (): JSX.Element | null => {
    const { mode, selectedCategory } = viewState

    // Determine the view key
    let viewKey: ViewKey =
      mode === ViewMode.INITIAL ? ViewMode.INITIAL : (`${variant}-${mode}` as ViewKey)

    // Get the view configuration
    const config = viewConfig.get(viewKey)
    if (!config) return null

    // Check if view should render
    if (config.shouldRender && !config.shouldRender(viewState)) {
      return null
    }

    // Get templates for category view
    const templates = selectedCategory ? tableTemplates[selectedCategory] ?? [] : []

    // Render the view with all necessary props
    return config.render({
      // Components
      InitialView,
      CategoryView,
      AIInputView,
      ResultsView,
      // Props
      variant,
      disabled,
      onDismiss,
      state: viewState,
      prompt: aiPrompt,
      isGenerating,
      inputRef,
      templates,
      handlers,
    })
  }

  return getView()
}
