import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Badge } from 'ui'

interface BillingChangeBadgeProps {
  beforePrice?: number
  afterPrice?: number
  show: boolean | undefined
}

const BillingChangeBadge = ({ beforePrice, afterPrice, show }: BillingChangeBadgeProps) => {
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
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-foreground-muted">
                ${beforePrice.toFixed(2)}
              </span>
              <ChevronRight size={12} strokeWidth={2} className="text-foreground-muted" />
              <span className="text-xs font-mono text-foreground">${afterPrice.toFixed(2)}</span>
            </div>
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BillingChangeBadge
