/**
 * Diagnostic Card Component
 *
 * Displays a diagnostic question with multiple choice options.
 */

import { motion } from 'framer-motion'
import { cn, Button } from 'ui'
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import Panel from '~/components/Panel'
import type { DiagnosticDetails } from '~/data/planner-flow'

interface DiagnosticOption {
  label: string
  nodeId: string
  isDotted: boolean
}

interface DiagnosticCardProps {
  question: string
  details: DiagnosticDetails | null
  options: DiagnosticOption[]
  onSelect: (nodeId: string, label: string) => void
  onBack: () => void
}

export function DiagnosticCard({
  question,
  details,
  options,
  onSelect,
  onBack,
}: DiagnosticCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-xl mx-auto"
    >
      <Panel
        outerClassName="w-full"
        innerClassName="p-6 md:p-8"
      >
        {/* Question header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-lg',
              'bg-gradient-to-br from-brand-400/20 to-brand-600/10',
              'border border-brand-500/20',
              'flex items-center justify-center',
              'text-brand-500'
            )}
          >
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-foreground text-lg md:text-xl font-medium leading-tight">
              {details?.title || question}
            </h2>
            {details?.helpText && (
              <p className="text-foreground-lighter text-sm mt-2">
                {details.helpText}
              </p>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, index) => (
            <motion.button
              key={option.nodeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: index * 0.1, duration: 0.3 },
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(option.nodeId, option.label)}
              className={cn(
                'w-full p-4 rounded-lg text-left',
                'border border-border-muted hover:border-brand-500/50',
                'bg-surface-100/50 hover:bg-surface-200/50',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                'group'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground-light group-hover:text-foreground transition-colors">
                  {option.label}
                </span>
                <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-brand-500 transition-colors shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Back button */}
        <div className="mt-6 pt-4 border-t border-border-muted">
          <Button
            type="text"
            onClick={onBack}
            className="text-foreground-muted hover:text-foreground"
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Go back
          </Button>
        </div>
      </Panel>
    </motion.div>
  )
}
