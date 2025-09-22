import { QuickstartVariant, ViewMode } from './types'

export type ViewConfig = {
  variant: QuickstartVariant
  mode: ViewMode
  render: (props: any) => JSX.Element | null
  shouldRender?: (state: any) => boolean
}

export type ViewKey =
  | ViewMode.INITIAL
  | ViewMode.CATEGORY_SELECTED
  | `${QuickstartVariant}-${ViewMode}`

// Create a view configuration map for both template and AI systems
export const createViewConfig = (): Map<ViewKey, ViewConfig> => {
  const config = new Map<ViewKey, ViewConfig>()

  // Shared initial view - shows both template categories and AI option
  config.set(ViewMode.INITIAL, {
    variant: QuickstartVariant.AI, // Used by both
    mode: ViewMode.INITIAL,
    render: ({ InitialView, variant, disabled, onDismiss, handlers }) => (
      <InitialView
        variant={variant}
        disabled={disabled}
        onDismiss={onDismiss}
        onCategorySelect={handlers.onCategorySelect}
        onAISelect={handlers.onAISelect}
        onQuickIdea={handlers.onQuickIdea}
      />
    ),
  })

  // Template views
  config.set(`${QuickstartVariant.TEMPLATES}-${ViewMode.CATEGORY_SELECTED}`, {
    variant: QuickstartVariant.TEMPLATES,
    mode: ViewMode.CATEGORY_SELECTED,
    render: ({ CategoryView, state, templates, handlers }) => (
      <CategoryView
        category={state.selectedCategory!}
        templates={templates}
        selectedTemplate={state.selectedTemplate}
        onBack={handlers.onBack}
        onSelectTemplate={handlers.onSelectTemplate}
      />
    ),
    shouldRender: (state) => !!state.selectedCategory,
  })

  // AI views
  config.set(`${QuickstartVariant.AI}-${ViewMode.CATEGORY_SELECTED}`, {
    variant: QuickstartVariant.AI,
    mode: ViewMode.CATEGORY_SELECTED,
    render: ({ CategoryView, state, templates, handlers }) => (
      <CategoryView
        category={state.selectedCategory!}
        templates={templates}
        selectedTemplate={state.selectedTemplate}
        onBack={handlers.onBack}
        onSelectTemplate={handlers.onSelectTemplate}
      />
    ),
    shouldRender: (state) => !!state.selectedCategory,
  })

  config.set(`${QuickstartVariant.AI}-${ViewMode.AI_INPUT}`, {
    variant: QuickstartVariant.AI,
    mode: ViewMode.AI_INPUT,
    render: ({ AIInputView, prompt, state, isGenerating, inputRef, handlers }) => (
      <AIInputView
        prompt={prompt}
        error={state.error}
        isGenerating={isGenerating}
        isLoading={state.isLoading}
        inputRef={inputRef}
        onBack={handlers.onBack}
        onPromptChange={handlers.onPromptChange}
        onGenerate={handlers.onGenerate}
      />
    ),
  })

  config.set(`${QuickstartVariant.AI}-${ViewMode.AI_RESULTS}`, {
    variant: QuickstartVariant.AI,
    mode: ViewMode.AI_RESULTS,
    render: ({ ResultsView, state, handlers }) => (
      <ResultsView
        tables={state.generatedTables}
        selectedTemplate={state.selectedTemplate}
        title="AI Generated Tables"
        onBack={handlers.onBack}
        onSelectTemplate={handlers.onSelectTemplate}
      />
    ),
    shouldRender: (state) => state.generatedTables.length > 0,
  })

  return config
}
