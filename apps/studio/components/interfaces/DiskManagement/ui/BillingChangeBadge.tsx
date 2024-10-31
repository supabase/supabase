import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

import { formatCurrency } from 'lib/helpers'
import { Badge, cn, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

interface BillingChangeBadgeProps {
  beforePrice?: number
  afterPrice?: number
  show: boolean | undefined
  tooltip?: string
  className?: string
  free?: boolean
}

const BillingChangeBadge = ({
  beforePrice,
  afterPrice,
  show,
  tooltip,
  className,
  free,
}: BillingChangeBadgeProps) => {
  return (
    <AnimatePresence>
      {beforePrice !== undefined && afterPrice !== undefined && show && (
        <motion.div
          initial={{ opacity: 0, x: -4, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          exit={{ opacity: 0, x: -4, height: 0 }}
          transition={{ type: 'spring', stiffness: 800, damping: 40, duration: 0.3 }}
          // key={afterPrice} // This key will change whenever any form value changes
          // whileHover={{ scale: 1.05 }}
          // whileTap={{ scale: 0.95 }}
        >
          <Badge
            variant="default"
            className={cn(
              !free ? `bg-alternative` : `bg-warning-200 border-warning-500 text-warning`,
              `bg-opacity-100`,
              className
            )}
          >
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-foreground-muted">
                    {formatCurrency(beforePrice)}
                  </span>
                  <ChevronRight size={12} strokeWidth={2} className="text-foreground-muted" />
                  <motion.span
                    key={afterPrice} // This key will change whenever any form value changes
                    className="text-xs font-mono text-foreground"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.12 }}
                  >
                    {free ? 'Free' : `${formatCurrency(afterPrice)}/month`}
                  </motion.span>
                </div>
              </TooltipTrigger_Shadcn_>
              {tooltip !== undefined && (
                <TooltipContent_Shadcn_ side="bottom">{tooltip}</TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { BillingChangeBadge }
