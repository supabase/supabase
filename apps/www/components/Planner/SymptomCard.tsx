/**
 * Symptom Card Component
 *
 * Displays a database symptom that users can select to start the diagnostic flow.
 * Uses layout animations to smoothly reorder when search filters are applied.
 */

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn } from 'ui'
import Panel from '~/components/Panel'
import { getPlannerIcon } from './PlannerIcons'
import type { SymptomDetails } from '~/data/planner-flow'

interface SymptomCardProps {
  id: string
  details: SymptomDetails
  onSelect: (id: string) => void
}

export function SymptomCard({ id, details, onSelect }: SymptomCardProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, layout: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
    >
      <Panel
        hasActiveOnHover
        outerClassName="h-full"
        innerClassName="p-4 md:p-5 flex gap-4 items-start h-full"
      >
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg',
            'bg-gradient-to-br from-brand-400/20 to-brand-600/10',
            'border border-brand-500/20',
            'flex items-center justify-center',
            'text-brand-500'
          )}
        >
          {getPlannerIcon(details.icon, 'w-5 h-5 md:w-6 md:h-6')}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground font-medium text-sm md:text-base leading-tight">
            {details.title}
          </h3>
          <p className="text-foreground-lighter text-xs md:text-sm mt-1 leading-relaxed">
            {details.description}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 shrink-0 text-foreground-muted group-hover/panel:text-foreground transition-colors" />
      </Panel>
    </motion.button>
  )
}
