import { useState, useCallback, useMemo } from 'react'
import { tableTemplates } from './templates'
import { QuickstartVariant, ViewMode } from './types'
import { convertTableSuggestionToTableField } from './utils'
import { InitialView } from './components/InitialView'
import { CategoryView } from './components/CategoryView'
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

  // Memoize view configuration
  const viewConfig = useMemo(() => createViewConfig(), [])

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setViewState((prev) => ({ ...prev, selectedTemplate: template }))
    },
    [onSelectTemplate]
  )

  const handleReset = useCallback(() => {
    setViewState(initialViewState)
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
      onBack: handleReset,
      onSelectTemplate: handleSelectTemplate,
    }),
    [handleReset, handleSelectTemplate]
  )

  // Get the appropriate view component
  const getView = (): JSX.Element | null => {
    const { mode, selectedCategory } = viewState

    // Determine the view key based on mode
    let viewKey: ViewKey = mode

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
      ResultsView,
      // Props
      variant,
      disabled,
      onDismiss,
      state: viewState,
      templates,
      handlers,
    })
  }

  return getView()
}