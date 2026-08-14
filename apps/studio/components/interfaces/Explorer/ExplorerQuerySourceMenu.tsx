import { useFlag, useParams } from 'common'
import { Check, ChevronDown } from 'lucide-react'
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
import { QuerySourceIcon } from '@/components/interfaces/QuerySources/QuerySourceIcon'
import { useLogsCustomRange } from '@/components/interfaces/QuerySources/useLogsCustomRange'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import {
  createDefaultCellSource,
  QUERY_SOURCE_LABELS,
  QUERY_SOURCES,
  type CellSource,
} from '@/data/query-sources/query-source-registry'

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
  const {
    isCustomRangeOpen,
    setIsCustomRangeOpen,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleApplyCustomRange,
  } = useLogsCustomRange({
    onRangeChange: (timeRange) =>
      onSourceChange({ id: 'logs', type: 'logs', parameters: { time_range: timeRange } }),
  })

  const availableSources = QUERY_SOURCES.filter(
    (candidate) =>
      candidate.type !== 'logs' ||
      (isLogsSourceEnabled && isOtelLogsEnabled) ||
      source.type === 'logs'
  )

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
            onApply={handleApplyCustomRange}
          />
          <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
        </>
      )}
    </>
  )
}
