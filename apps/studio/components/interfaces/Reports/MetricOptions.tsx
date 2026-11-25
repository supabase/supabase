import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { CheckIcon, HomeIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  SQL_ICON,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { BURSTABLE_IO_METRIC_KEYS, DEPRECATED_REPORTS } from './Reports.constants'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useContentQuery } from '@/data/content/content-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useProjectDiskLimits } from '@/hooks/misc/useProjectDiskLimits'
import { Metric, METRIC_CATEGORIES, METRICS } from '@/lib/constants/metrics'
import { onSearchInputEscape } from '@/lib/keyboard'
import { useTrack } from '@/lib/telemetry/track'
import { editorPanelState } from '@/state/editor-panel-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import type { Dashboards } from '@/types'

interface MetricOptionsProps {
  config?: Dashboards.Content
  onAddCharts: (metrics: Metric[]) => void
}

export const MetricOptions = ({ config, onAddCharts }: MetricOptionsProps) => {
  const { ref: projectRef } = useParams()
  const { openSidebar } = useSidebarManagerSnapshot()
  const [search, setSearch] = useState('')
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>([])

  const toggleMetric = (metric: Metric) => {
    setSelectedMetrics((current) =>
      current.some((selected) => selected.key === metric.key)
        ? current.filter((selected) => selected.key !== metric.key)
        : [...current, metric]
    )
  }

  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])

  const { isBurstable: supportsBurstableIO } = useProjectDiskLimits()

  const metricCategories = Object.values(METRIC_CATEGORIES).filter(({ key }) => {
    if (key === 'api_auth') return authEnabled
    if (key === 'api_storage') return storageEnabled
    return true
  })

  const track = useTrack()

  const debouncedSearch = useDebounce(search, 300)
  const {
    data,
    isPending: isLoading,
    refetch,
  } = useContentQuery({
    projectRef,
    type: 'sql',
    name: debouncedSearch.length === 0 ? undefined : debouncedSearch,
  })
  const snippets = data?.content

  return (
    <>
      {metricCategories.map((cat) => {
        return (
          <DropdownMenuSub key={cat.key}>
            <DropdownMenuSubTrigger className="space-x-2">
              {cat.icon ? cat.icon() : <HomeIcon size={14} />}
              <p>{cat.label}</p>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {METRICS.filter(
                  (metric) =>
                    !DEPRECATED_REPORTS.includes(metric.key) &&
                    metric?.category?.key === cat.key &&
                    (supportsBurstableIO || !BURSTABLE_IO_METRIC_KEYS.includes(metric.key))
                ).map((metric) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={metric.key}
                      className="cursor-pointer"
                      checked={
                        config?.layout?.some((chart) => chart.attribute === metric.key) ||
                        selectedMetrics.some((selected) => selected.key === metric.key)
                      }
                      disabled={config?.layout?.some((chart) => chart.attribute === metric.key)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={() => toggleMetric(metric)}
                    >
                      <div className="flex flex-col space-y-0">
                        <span>{metric.label}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )
      })}
      <DropdownMenuSub
        onOpenChange={(open) => {
          if (open) refetch()
        }}
      >
        <DropdownMenuSubTrigger className="space-x-2">
          <SQL_ICON
            size={14}
            strokeWidth={1.5}
            className="fill-foreground-light w-5 h-4 shrink-0 grow-0 -ml-0.5"
          />
          <p>SQL snippets</p>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="p-0">
            <Command shouldFilter={false}>
              <CommandInput
                autoFocus
                placeholder="Search snippets..."
                value={search}
                onValueChange={setSearch}
                onKeyDown={onSearchInputEscape(search, setSearch)}
              />
              <CommandList>
                {isLoading ? (
                  <div className="flex flex-col p-1 gap-y-1">
                    <ShimmeringLoader />
                    <ShimmeringLoader className="w-3/4" />
                  </div>
                ) : !snippets?.length ? (
                  <p className="text-xs text-center text-foreground-lighter py-3">
                    No snippets found
                  </p>
                ) : null}
                <CommandGroup>
                  {snippets?.map((snippet) => (
                    <CommandItem
                      key={snippet.id}
                      value={snippet.id}
                      className="cursor-pointer"
                      disabled={config?.layout?.some(
                        (chart) =>
                          chart.id === snippet.id || chart.attribute === `snippet_${snippet.id}`
                      )}
                      onSelect={() =>
                        toggleMetric({
                          id: snippet.id,
                          key: `snippet_${snippet.id}`,
                          label: snippet.name,
                        })
                      }
                    >
                      <CheckIcon
                        size={14}
                        aria-hidden="true"
                        className={cn(
                          'mr-2 shrink-0',
                          !config?.layout?.some(
                            (chart) =>
                              chart.id === snippet.id || chart.attribute === `snippet_${snippet.id}`
                          ) &&
                            !selectedMetrics.some((metric) => metric.id === snippet.id) &&
                            'invisible'
                        )}
                      />
                      <span className="truncate">{snippet.name}</span>
                      {selectedMetrics.some((metric) => metric.id === snippet.id) && (
                        <span className="sr-only">Selected</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>

              <div className="h-px bg-border-overlay -mx-1" />

              <CommandGroup>
                <CommandItem
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    editorPanelState.openAsNew()
                    openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
                  }}
                >
                  <div className="w-full flex items-center gap-2">
                    <PlusIcon size={14} strokeWidth={1.5} />
                    <p>Create snippet</p>
                  </div>
                </CommandItem>
              </CommandGroup>
            </Command>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={selectedMetrics.length === 0}
        onSelect={() => {
          onAddCharts(selectedMetrics)
          selectedMetrics
            .filter((metric) => metric.key.startsWith('snippet_'))
            .forEach(() => track('custom_report_add_sql_block_clicked'))
        }}
      >
        <span>{`Add ${selectedMetrics.length} ${selectedMetrics.length === 1 ? 'block' : 'blocks'}`}</span>
      </DropdownMenuItem>
    </>
  )
}
