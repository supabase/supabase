import { useFlag, useParams } from 'common'
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { DatabaseParametersSubMenu } from '@/components/interfaces/QuerySources/DatabaseParametersSubMenu'
import { LogsCustomRangeDialog } from '@/components/interfaces/QuerySources/LogsCustomRangeDialog'
import { LogsTimeRangeSubMenu } from '@/components/interfaces/QuerySources/LogsTimeRangeSubMenu'
import { customDateRangeToLogTimeRange } from '@/components/interfaces/QuerySources/LogTimeRange.utils'
import { QuerySourceIcon } from '@/components/interfaces/QuerySources/QuerySourceIcon'
import { maybeShowUpgradePromptIfNotEntitled } from '@/components/interfaces/Settings/Logs/Logs.utils'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import {
  createDefaultCellSource,
  QUERY_SOURCE_LABELS,
  QUERY_SOURCES,
  type CellSource,
} from '@/data/query-sources/query-source-registry'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

export type ExplorerQuerySourceMenuProps = {
  source: CellSource
  onSourceChange: (source: CellSource) => void
}

/**
 * Source binding and parameter controls shared by standalone Explorer queries
 * and notebook query-cell toolbars. The consumer owns the binding; this menu
 * only emits complete, validated-by-construction `CellSource` values.
 */
export const ExplorerQuerySourceMenu = ({
  source,
  onSourceChange,
}: ExplorerQuerySourceMenuProps) => {
  const { ref } = useParams()
  const isLogsSourceEnabled = useFlag('sqlEditorLogsSource')
  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToLogDays = getEntitlementNumericValue()

  const availableSources = QUERY_SOURCES.filter(
    (candidate) =>
      candidate.type !== 'logs' ||
      (isLogsSourceEnabled && isOtelLogsEnabled) ||
      source.type === 'logs'
  )

  const applyCustomRange = ({ from, to }: { from: Date; to: Date }) => {
    const time_range = customDateRangeToLogTimeRange({ from, to })
    if (maybeShowUpgradePromptIfNotEntitled(time_range.start, entitledToLogDays)) {
      setShowUpgradePrompt(true)
      return
    }

    onSourceChange({ id: 'logs', type: 'logs', parameters: { time_range } })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="text"
            size="tiny"
            aria-label={`Query source: ${QUERY_SOURCE_LABELS[source.id]}`}
            icon={<QuerySourceIcon source={source.id} className="text-foreground-light" />}
            iconRight={<ChevronDown className="text-foreground-light" />}
          >
            {QUERY_SOURCE_LABELS[source.id]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {availableSources.map((candidate) => (
            <DropdownMenuItem
              key={candidate.id}
              className="justify-between"
              onSelect={(event) => {
                event.preventDefault()
                if (candidate.id !== source.id) {
                  onSourceChange(createDefaultCellSource(candidate.id))
                }
              }}
            >
              <span className="flex items-center gap-x-2">
                <QuerySourceIcon source={candidate.id} className="text-foreground-light" />
                {QUERY_SOURCE_LABELS[candidate.id]}
              </span>
              {source.id === candidate.id && <Check size={14} />}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {source.type === 'database' ? (
            <DatabaseParametersSubMenu
              identifier={source.parameters.identifier ?? ref}
              onIdentifierChange={(identifier) =>
                onSourceChange({
                  id: 'database',
                  type: 'database',
                  parameters: { identifier },
                })
              }
            />
          ) : (
            <LogsTimeRangeSubMenu
              range={source.parameters.time_range}
              onRangeChange={(timeRange) =>
                onSourceChange({
                  id: 'logs',
                  type: 'logs',
                  parameters: { time_range: timeRange },
                })
              }
              onOpenCustomRange={() => setIsCustomRangeOpen(true)}
              onShowUpgrade={() => setShowUpgradePrompt(true)}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {source.type === 'logs' && (
        <>
          <LogsCustomRangeDialog
            open={isCustomRangeOpen}
            onOpenChange={setIsCustomRangeOpen}
            onApply={applyCustomRange}
          />
          <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
        </>
      )}
    </>
  )
}
