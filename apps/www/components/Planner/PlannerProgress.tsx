/**
 * Planner Progress Components
 *
 * Visual indicators showing the user's journey through the diagnostic flow.
 */

import { motion } from 'framer-motion'
import { cn } from 'ui'
import { Check, ChevronRight, Circle, HelpCircle, Lightbulb } from 'lucide-react'
import type { FlowNode } from '~/lib/planner/types'

interface PathStep {
  node: FlowNode
  choiceLabel?: string
}

interface ProgressBarProps {
  progress: number
  isComplete: boolean
}

export function ProgressBar({ progress, isComplete }: ProgressBarProps) {
  return (
    <div className="w-full h-1 bg-surface-200 rounded-full overflow-hidden">
      <motion.div
        className={cn(
          'h-full rounded-full',
          isComplete ? 'bg-brand-500' : 'bg-brand-500/70'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

interface PathBreadcrumbsProps {
  pathHistory: PathStep[]
}

export function PathBreadcrumbs({ pathHistory }: PathBreadcrumbsProps) {
  if (pathHistory.length === 0) return null

  const getStepIcon = (node: FlowNode, isLast: boolean) => {
    if (!isLast) return <Check className="w-3 h-3" />
    switch (node.type) {
      case 'symptom':
        return <Circle className="w-3 h-3" />
      case 'diagnostic':
        return <HelpCircle className="w-3 h-3" />
      case 'solution':
      case 'future':
        return <Lightbulb className="w-3 h-3" />
      default:
        return <Circle className="w-3 h-3" />
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {pathHistory.map((step, index) => {
        const isLast = index === pathHistory.length - 1
        const displayLabel = step.choiceLabel || step.node.label

        return (
          <div key={`${step.node.id}-${index}`} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0" />
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                'border text-brand-500 bg-brand-500/10 border-brand-500/30'
              )}
            >
              {getStepIcon(step.node, isLast)}
              <span className="max-w-[120px] truncate">{displayLabel}</span>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
