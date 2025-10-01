import { QuickstartVariant, ViewMode } from './types'

export type ViewConfig = {
  variant: QuickstartVariant
  mode: ViewMode
  render: (props: any) => JSX.Element | null
  shouldRender?: (state: any) => boolean
}

export type ViewKey = ViewMode.INITIAL | ViewMode.CATEGORY_SELECTED

// Create a view configuration map for the template system
export const createViewConfig = (): Map<ViewKey, ViewConfig> => {
  const config = new Map<ViewKey, ViewConfig>()

  // Initial view - category selection
  config.set(ViewMode.INITIAL, {
    variant: QuickstartVariant.TEMPLATES,
    mode: ViewMode.INITIAL,
    render: ({ InitialView, variant, disabled, onDismiss, handlers }) => (
      <InitialView
        variant={variant}
        disabled={disabled}
        onDismiss={onDismiss}
        onCategorySelect={handlers.onCategorySelect}
      />
    ),
  })

  // Category selected - show templates
  config.set(ViewMode.CATEGORY_SELECTED, {
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

  return config
}
