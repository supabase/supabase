import { ArrowLeft, Sparkles, Layout } from 'lucide-react'
import { cn } from 'ui'
import { TemplateSelector } from './TemplateSelector'
import { AiPromptInput } from './AiPromptInput'
import { TablePicker } from './TablePicker'
import { TablePickerSkeleton } from './TablePickerSkeleton'
import { GETTING_STARTED_WIDGET_COPY } from './constants'
import { useQuickstart } from './useQuickstart'
import { GetStartedHero } from 'components/interfaces/Home/NewProjectPanel/GetStartedHero'

interface TableQuickstartProps {
  variant?: 'ai' | 'templates'
}

export const TableQuickstart = ({ variant = 'ai' }: TableQuickstartProps = {}) => {
  const {
    currentStep,
    candidates,
    loading,
    error,
    userInput,
    isGenerating,
    onTablesReady,
    handleAiGenerate,
    handleSelectTable,
    handleBack,
  } = useQuickstart()

  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 lg:col-span-7 space-y-8">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {variant === 'ai' ? (
              <Sparkles className="h-5 w-5 text-brand" />
            ) : (
              <Layout className="h-5 w-5 text-brand" />
            )}
            <h2 className="text-2xl font-medium">
              {GETTING_STARTED_WIDGET_COPY[variant]?.title}
            </h2>
          </div>
          <p className="text-sm text-foreground-light max-w-2xl">
            {GETTING_STARTED_WIDGET_COPY[variant]?.description}
          </p>
        </div>

        {/* Content Section with Transitions */}
        <div className="min-h-[400px]">
          {/* Step 1: Input Form */}
          <div
            className={cn(
              'transition-all duration-500',
              currentStep === 'input' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'
            )}
          >
            {variant === 'ai' && (
              <div className="space-y-8">
                <AiPromptInput onGenerate={handleAiGenerate} isLoading={isGenerating} />

                {/* Example Templates */}
                <div className="space-y-3">
                  <p className="text-xs text-foreground-lighter font-medium uppercase tracking-wide">
                    Popular templates
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Todo app with user accounts',
                      'Blog with comments',
                      'E-commerce store',
                      'SaaS dashboard',
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => handleAiGenerate(example)}
                        disabled={isGenerating}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-full border transition-all',
                          'bg-surface-100 border-default hover:border-foreground/20',
                          'hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {variant === 'templates' && (
              <TemplateSelector onSelect={onTablesReady} />
            )}
          </div>

          {/* Step 2: Table Selection */}
          <div
            className={cn(
              'transition-all duration-500',
              currentStep === 'preview' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'
            )}
          >
            <div className="space-y-6">
              {/* Back Button and Context */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className={cn(
                    'inline-flex items-center gap-2 text-sm text-foreground-light',
                    'hover:text-foreground transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <ArrowLeft size={14} />
                  <span>Back to {variant === 'ai' ? 'prompt' : 'templates'}</span>
                </button>

                {variant === 'ai' && userInput && (
                  <div className="p-3 bg-surface-100 rounded-lg border border-default">
                    <p className="text-xs text-foreground-lighter mb-1">Generated tables for:</p>
                    <p className="text-sm text-foreground font-medium">"{userInput}"</p>
                  </div>
                )}
              </div>

              {/* Table Cards */}
              {isGenerating ? (
                <TablePickerSkeleton />
              ) : (
                <TablePicker
                  tables={candidates}
                  onSelectTable={handleSelectTable}
                  loading={loading}
                />
              )}

              {/* Error State */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="col-span-12 lg:col-span-5">
        <GetStartedHero />
      </div>
    </div>
  )
}
