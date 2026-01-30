/**
 * Solution Card Component
 *
 * Displays the recommended Supabase solution with details, benefits, and links.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn, Button } from 'ui'
import { ArrowUpRight, Check, ChevronLeft, Clock, Sparkles } from 'lucide-react'
import Panel from '~/components/Panel'
import { getPlannerIcon } from './PlannerIcons'
import type { SolutionDetails } from '~/data/planner-flow'

interface RelatedSolution {
  node: { id: string; label: string }
  details: SolutionDetails
  label?: string
}

interface SolutionCardProps {
  details: SolutionDetails
  relatedSolutions: RelatedSolution[]
  onReset: () => void
  onBack: () => void
}

export function SolutionCard({
  details,
  relatedSolutions,
  onReset,
  onBack,
}: SolutionCardProps) {
  const isFuture = details.isFuture

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      <Panel
        outerClassName="w-full"
        innerClassName="p-0 overflow-hidden"
        activeColor={isFuture ? 'default' : 'brand'}
      >
        {/* Header with gradient */}
        <div
          className={cn(
            'p-6 md:p-8',
            'bg-gradient-to-br from-brand-500/10 via-brand-600/5 to-transparent'
          )}
        >
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={cn(
                'flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl',
                'bg-gradient-to-br from-brand-400/20 to-brand-600/20 border border-brand-500/30 text-brand-500'
              )}
            >
              <div className="w-full h-full flex items-center justify-center">
                {getPlannerIcon(details.icon, 'w-7 h-7 md:w-8 md:h-8')}
              </div>
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-foreground text-xl md:text-2xl font-semibold"
                >
                  {details.title}
                </motion.h2>
                {isFuture && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-foreground-muted/10 text-foreground-muted border border-foreground-muted/20">
                    <Sparkles className="w-3 h-3" />
                    Coming Soon
                  </span>
                )}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-foreground-light text-sm md:text-base mt-1"
              >
                {details.subtitle}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 md:px-8 py-4">
          <p className="text-foreground-lighter text-sm md:text-base leading-relaxed">
            {details.description}
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 md:px-8 pb-4">
          <h3 className="text-foreground-light text-sm font-medium mb-3">Key benefits</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {details.benefits.map((benefit, index) => (
              <motion.li
                key={benefit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-start gap-2 text-sm text-foreground-light"
              >
                <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Pricing / Availability */}
        {(details.pricing || details.availability) && (
          <div className="px-6 md:px-8 py-3 bg-surface-100/50 border-t border-border-muted">
            <div className="flex items-center gap-2 text-sm">
              {details.availability ? (
                <>
                  <Clock className="w-4 h-4 text-foreground-muted" />
                  <span className="text-foreground-light">{details.availability}</span>
                </>
              ) : (
                <>
                  <span className="text-foreground-muted">Pricing:</span>
                  <span className="text-foreground-light font-medium">{details.pricing}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 md:px-8 py-4 bg-surface-100/30 border-t border-border-muted">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              type="primary"
              size="small"
              className="flex-1"
              iconRight={<ArrowUpRight className="w-4 h-4" />}
            >
              <Link href={details.docsUrl}>
                {isFuture ? 'Learn more' : 'View documentation'}
              </Link>
            </Button>
            <Button type="default" size="small" onClick={onReset}>
              Start over
            </Button>
          </div>
        </div>

        {/* Related solutions */}
        {relatedSolutions.length > 0 && (
          <div className="px-6 md:px-8 py-4 bg-surface-200/30 border-t border-border-muted">
            <h3 className="text-foreground-muted text-xs font-medium uppercase tracking-wide mb-3">
              Next steps when you outgrow this
            </h3>
            <div className="space-y-2">
              {relatedSolutions.map((related) => (
                <Link
                  key={related.node.id}
                  href={related.details.docsUrl}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    'bg-surface-100/50 hover:bg-surface-200/50',
                    'border border-dashed border-border-muted hover:border-border-strong',
                    'transition-all duration-200 group'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg',
                      'bg-surface-200/50',
                      'flex items-center justify-center',
                      'text-foreground-muted group-hover:text-foreground-light transition-colors'
                    )}
                  >
                    {getPlannerIcon(related.details.icon, 'w-4 h-4')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground-light text-sm font-medium group-hover:text-foreground transition-colors">
                      {related.details.title}
                    </div>
                    {related.label && (
                      <div className="text-foreground-muted text-xs">{related.label}</div>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground-light transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="px-6 md:px-8 py-3 border-t border-border-muted">
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
