import { ArrowLeft } from 'lucide-react'
import { cn } from 'ui'
import { TemplateSelector } from './TemplateSelector'
import { AiPromptInput } from './AiPromptInput'
import { TablePicker } from './TablePicker'
import { TablePickerSkeleton } from './TablePickerSkeleton'
import { useQuickstart } from './useQuickstart'

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
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        <div className="bg-surface-100 border border-default rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          {/* Header Section */}
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-medium text-foreground">
              What kind of app are you building?
            </h2>
            {variant === 'ai' && (
              <p className="text-sm text-foreground-light">
                Describe your idea and we'll generate the tables
              </p>
            )}
            {variant === 'templates' && (
              <p className="text-sm text-foreground-light">
                Start with a pre-built schema for common app types
              </p>
            )}
          </div>

          <div className={cn('transition-all duration-500 ease-in-out')}>
            {/* Step 1: Input Form */}
            <div
              className={cn(
                'transition-all duration-500',
                currentStep === 'input'
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 hidden'
              )}
            >
              {variant === 'ai' && (
                <div className="space-y-8">
                  <AiPromptInput onGenerate={handleAiGenerate} isLoading={isGenerating} />

                  {/* Example Templates */}
                  {!isGenerating && (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-default"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-foreground-lighter">
                            Quick ideas
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          'Social media platform',
                          'Project management tool',
                          'E-commerce marketplace',
                          'Content management system',
                        ].map((example) => (
                          <button
                            key={example}
                            onClick={() => handleAiGenerate(example)}
                            disabled={isGenerating}
                            className={cn(
                              'px-3 py-1.5 text-xs rounded-md border transition-all',
                              'bg-surface-100 border-default hover:border-foreground/20',
                              'hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {variant === 'templates' && <TemplateSelector onSelect={onTablesReady} />}
            </div>

            {/* Step 2: Table Selection */}
            <div
              className={cn(
                'transition-all duration-500 transform',
                currentStep === 'preview' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'
              )}
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  {/* Back Button */}
                  {!isGenerating && (
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
                  )}

                  {/* User Input */}
                  {userInput && (
                    <div className="p-3 bg-surface-100 rounded-lg border border-default">
                      <p className="text-xs text-foreground-lighter mb-1">
                        {isGenerating ? 'Generating tables for:' : 'Generated tables for:'}
                      </p>
                      <p className="text-sm text-foreground font-medium">
                        {variant === 'templates' ? userInput : `"${userInput}"`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Table Cards */}
                {isGenerating && currentStep === 'preview' ? (
                  <TablePickerSkeleton />
                ) : (
                  candidates.length > 0 && (
                    <TablePicker
                      tables={candidates}
                      onSelectTable={handleSelectTable}
                      loading={loading}
                    />
                  )
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
      </div>
    </div>
  )
}
