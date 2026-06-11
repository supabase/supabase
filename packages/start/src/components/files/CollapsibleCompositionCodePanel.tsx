'use client'

import { motion } from 'framer-motion'
import { ChevronUp, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, cn } from 'ui'

import type { MergeResult } from '../../lib/composition/composition'
import type { ConfigRailStepId } from '../../lib/config-rail-steps'
import { CompositionCodePanel } from './CompositionCodePanel'

const CODE_PANEL_HEADER_HEIGHT = 40
const CODE_PANEL_EXPANDED_HEIGHT = 320

interface CollapsibleCompositionCodePanelProps {
  mergeResult: MergeResult | null
  activeFilePath: string | null
  onActiveFilePathChange: (path: string | null) => void
  onboardingStepId: ConfigRailStepId | null
  onDownload: () => void
}

export function CollapsibleCompositionCodePanel({
  mergeResult,
  activeFilePath,
  onActiveFilePathChange,
  onboardingStepId,
  onDownload,
}: CollapsibleCompositionCodePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (onboardingStepId === 'code') {
      setIsExpanded(true)
      return
    }

    if (onboardingStepId !== null) {
      setIsExpanded(false)
    }
  }, [onboardingStepId])

  return (
    <motion.div
      className="flex shrink-0 flex-col overflow-hidden border-t bg-background"
      initial={false}
      animate={{
        height: isExpanded ? CODE_PANEL_EXPANDED_HEIGHT : CODE_PANEL_HEADER_HEIGHT,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      <div className="flex h-10 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm font-medium text-foreground"
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            Backend Code
          </button>
          <Button
            type="text"
            size="tiny"
            className="px-1 text-foreground-light"
            icon={<Download className="h-3.5 w-3.5" />}
            disabled={!mergeResult}
            aria-label="Download backend code"
            onClick={onDownload}
          />
        </div>
        <button
          type="button"
          className="flex items-center text-foreground-light"
          aria-label={isExpanded ? 'Collapse backend code' : 'Expand backend code'}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <ChevronUp
            className={cn('h-4 w-4 transition-transform duration-200', !isExpanded && 'rotate-180')}
          />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden border-t border-default">
        <CompositionCodePanel
          mergeResult={mergeResult}
          activeFilePath={activeFilePath}
          onActiveFilePathChange={onActiveFilePathChange}
          embedded
        />
      </div>
    </motion.div>
  )
}
