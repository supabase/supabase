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
  createDefaultSourceBinding,
  QUERY_SOURCE_LABELS,
  QUERY_SOURCES,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'

export type ExplorerQuerySourceMenuProps = {
  source: QuerySourceBinding
  onSourceChange: (source: QuerySourceBinding) => void
}

/**
 * Source binding and parameter controls shared by standalone Explorer queries
 * and notebook query-cell toolbars. The consumer owns the binding; this menu
 * only emits complete, validated-by-construction `QuerySourceBinding` values.
 *
 * Selecting a different backend emits that backend's default binding — deciding
 * what happens to the query body is the consumer's call, since a notebook cell
 * has SQL to preserve or discard and a fresh draft does not.
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
    onRangeChange: (time_range) => onSourceChange({ _tag: 'logs', time_range }),
  })

  const availableSources = QUERY_SOURCES.filter(
    (candidate) =>
      candidate._tag !== 'logs' ||
      (isLogsSourceEnabled && isOtelLogsEnabled) ||
      source._tag === 'logs'
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="text"
            size="tiny"
            aria-label={`Query source: ${QUERY_SOURCE_LABELS[source._tag]}`}
            icon={<QuerySourceIcon source={source._tag} className="text-foreground-light" />}
            iconRight={<ChevronDown className="text-foreground-light" />}
          >
            {QUERY_SOURCE_LABELS[source._tag]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {availableSources.map((candidate) => (
            <DropdownMenuItem
              key={candidate._tag}
              className="justify-between"
              onSelect={(event) => {
                event.preventDefault()
                if (candidate._tag !== source._tag) {
                  onSourceChange(createDefaultSourceBinding(candidate._tag))
                }
              }}
            >
              <span className="flex items-center gap-x-2">
                <QuerySourceIcon source={candidate._tag} className="text-foreground-light" />
                {QUERY_SOURCE_LABELS[candidate._tag]}
              </span>
              {source._tag === candidate._tag && <Check size={14} />}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {source._tag === 'database' ? (
            <DatabaseParametersSubMenu
              identifier={source.database_identifier ?? ref}
              onIdentifierChange={(database_identifier) =>
                onSourceChange({ _tag: 'database', database_identifier })
              }
            />
          ) : (
            <LogsTimeRangeSubMenu
              range={source.time_range}
              onRangeChange={(time_range) => onSourceChange({ _tag: 'logs', time_range })}
              onOpenCustomRange={() => setIsCustomRangeOpen(true)}
              onShowUpgrade={() => setShowUpgradePrompt(true)}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {source._tag === 'logs' && (
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
