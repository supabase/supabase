import { AnimatePresence, motion } from 'framer-motion'
import { formatCurrency } from 'lib/helpers'
import { ChevronRight } from 'lucide-react'
import { Badge, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

interface BillingChangeBadgeProps {
  beforePrice?: number
  afterPrice?: number
  show: boolean | undefined
  tooltip?: string
}

const BillingChangeBadge = ({
  beforePrice,
  afterPrice,
  show,
  tooltip,
}: BillingChangeBadgeProps) => {
  return (
    <AnimatePresence>
      {beforePrice !== undefined && afterPrice !== undefined && show && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
        >
          <Badge variant="default" className="bg-alternative bg-opacity-100">
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-foreground-muted">
                    {formatCurrency(beforePrice)}
                  </span>
                  <ChevronRight size={12} strokeWidth={2} className="text-foreground-muted" />
                  <span className="text-xs font-mono text-foreground">
                    {formatCurrency(afterPrice)}
                  </span>
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

export default BillingChangeBadge
