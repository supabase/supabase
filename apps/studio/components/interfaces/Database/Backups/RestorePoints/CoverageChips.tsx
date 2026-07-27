import { AlertTriangle, Check } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { PrimitiveCoverage } from '@/data/restore-points/restore-points-mocks'

/**
 * Per-primitive coverage chips for a restore point. Makes it obvious at a glance
 * that a database backup does not necessarily protect Storage objects.
 */
export const CoverageChips = ({ primitives }: { primitives: PrimitiveCoverage[] }) => {
  return (
    <div className="flex items-center gap-x-1.5">
      {primitives.map((coverage) => {
        const isCovered = coverage.status === 'covered'
        return (
          <Tooltip key={coverage.primitive}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  'inline-flex items-center gap-x-1 rounded-full border px-2 py-0.5 text-xs',
                  isCovered
                    ? 'border-strong bg-surface-200 text-foreground-light'
                    : 'border-warning-500 bg-warning/10 text-warning-600'
                )}
              >
                {isCovered ? <Check size={11} /> : <AlertTriangle size={11} />}
                {coverage.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-72">
              {coverage.detail}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
