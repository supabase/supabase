import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Database } from 'lucide-react'
import { Button, cn } from 'ui'
import { AiIconAnimation } from 'ui'
import { useQuickstart } from '../legacy/useQuickstart'
import { AiTableGenerator } from './AiTableGenerator'
import { TemplateSelector } from './TemplateSelector'
import { TablePreviewGrid } from './TablePreviewGrid'
import { expandVariants, collapseVariants } from './animations'
import type { TableSuggestion } from '../legacy/types'

interface InlineTableQuickstartProps {
  variant: 'ai' | 'templates'
  projectRef: string
  onComplete?: () => void
  className?: string
}

type ViewState = 'collapsed' | 'expanded' | 'preview'

export function InlineTableQuickstart({
  variant,
  projectRef,
  onComplete,
  className,
}: InlineTableQuickstartProps) {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>('collapsed')
  const [selectedVariant, setSelectedVariant] = useState<'ai' | 'templates' | null>(null)

  const {
    currentStep,
    candidates,
    loading,
    error,
    userInput,
    isGenerating,
    onTablesReady,
    handleAiGenerate,
    handleSelectTable: originalHandleSelect,
    handleBack,
  } = useQuickstart()

  // Handle expanding the card
  const handleExpand = useCallback((selectedVariant: 'ai' | 'templates') => {
    setSelectedVariant(selectedVariant)
    setViewState('expanded')
  }, [])

  // Handle collapsing back
  const handleCollapse = useCallback(() => {
    setViewState('collapsed')
    setSelectedVariant(null)
  }, [])

  // Handle table selection with completion callback
  const handleSelectTable = useCallback(
    async (table: TableSuggestion) => {
      await originalHandleSelect(table)
      onComplete?.()

      // Collapse the card first, then navigate
      setViewState('collapsed')
      setTimeout(() => {
        router.push(`/project/${projectRef}/editor`)
      }, 300)
    },
    [originalHandleSelect, onComplete, projectRef, router]
  )

  // Handle AI generation
  const handleAiGenerateWithTransition = useCallback(
    async (prompt: string) => {
      await handleAiGenerate(prompt)
      setViewState('preview')
    },
    [handleAiGenerate]
  )

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (tables: TableSuggestion[], templateName: string) => {
      onTablesReady(tables, templateName)
      setViewState('preview')
    },
    [onTablesReady]
  )

  // Handle back from preview
  const handleBackFromPreview = useCallback(() => {
    handleBack()
    setViewState('expanded')
  }, [handleBack])

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {viewState === 'collapsed' && (
          <motion.div
            key="collapsed"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={collapseVariants}
            className="flex flex-wrap gap-2"
          >
            <Button
              type="default"
              onClick={() => handleExpand(variant === 'templates' ? 'templates' : 'ai')}
              icon={<Database size={14} />}
            >
              Create a table
            </Button>
            <Button
              type="default"
              onClick={() => handleExpand('ai')}
              icon={<AiIconAnimation size={14} />}
            >
              Do it for me
            </Button>
          </motion.div>
        )}

        {viewState === 'expanded' && (
          <motion.div
            key="expanded"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={expandVariants}
            className="space-y-4"
          >
            <button
              onClick={handleCollapse}
              className="inline-flex items-center gap-2 text-sm text-foreground-light hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            {selectedVariant === 'ai' ? (
              <AiTableGenerator
                onGenerate={handleAiGenerateWithTransition}
                isLoading={isGenerating}
              />
            ) : (
              <TemplateSelector onSelect={handleTemplateSelect} />
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </motion.div>
        )}

        {viewState === 'preview' && candidates.length > 0 && (
          <motion.div
            key="preview"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={expandVariants}
            className="space-y-4"
          >
            <div className="space-y-3">
              <button
                onClick={handleBackFromPreview}
                className="inline-flex items-center gap-2 text-sm text-foreground-light hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to {selectedVariant === 'ai' ? 'prompt' : 'templates'}</span>
              </button>

              {userInput && (
                <div className="p-3 bg-surface-100 rounded-lg border border-default">
                  <p className="text-xs text-foreground-lighter mb-1">
                    {isGenerating ? 'Generating tables for:' : 'Generated tables for:'}
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {selectedVariant === 'templates' ? userInput : `"${userInput}"`}
                  </p>
                </div>
              )}
            </div>

            <TablePreviewGrid
              tables={candidates}
              onSelectTable={handleSelectTable}
              loading={loading}
              isGenerating={isGenerating}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}