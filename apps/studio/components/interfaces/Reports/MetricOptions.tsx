import { useDebounce } from '@uidotdev/usehooks'
import { Home } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { TelemetryActions } from 'common/telemetry-constants'
import { useContentQuery } from 'data/content/content-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useFlag } from 'hooks/ui/useFlag'
import { Metric, METRIC_CATEGORIES, METRICS } from 'lib/constants/metrics'
import { Dashboards } from 'types'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  DropdownMenuCheckboxItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  SQL_ICON,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

interface MetricOptionsProps {
  config?: Dashboards.Content
  handleChartSelection: ({
    metric,
    isAddingChart,
  }: {
    metric: Metric
    isAddingChart: boolean
  }) => void
}

export const MetricOptions = ({ config, handleChartSelection }: MetricOptionsProps) => {
  const { ref: projectRef } = useParams()
  const supportSQLBlocks = useFlag('reportsV2')
  const [search, setSearch] = useState('')

  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])

  const metricCategories = Object.values(METRIC_CATEGORIES).filter(({ key }) => {
    if (key === 'api_auth') return authEnabled
    if (key === 'api_storage') return storageEnabled
    return true
  })

  const { mutate: sendEvent } = useSendEventMutation()

  const debouncedSearch = useDebounce(search, 300)
  const { data, isLoading } = useContentQuery({
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
              {cat.icon ? cat.icon() : <Home size={14} />}
              <p>{cat.label}</p>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {METRICS.filter((metric) => metric?.category?.key === cat.key).map((metric) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={metric.key}
                      className="cursor-pointer"
                      checked={config?.layout?.some((x: any) => x.attribute === metric.key)}
                      onCheckedChange={(e) => handleChartSelection({ metric, isAddingChart: e })}
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
      {supportSQLBlocks && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="space-x-2">
            <SQL_ICON
              size={14}
              strokeWidth={1.5}
              className="fill-foreground-light w-5 h-4 shrink-0 grow-0 -ml-0.5"
            />
            <p>SQL Snippets</p>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="p-0">
              <Command_Shadcn_ shouldFilter={false}>
                <CommandInput_Shadcn_
                  autoFocus
                  placeholder="Search snippets..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList_Shadcn_>
                  {isLoading ? (
                    <div className="flex flex-col p-1 gap-y-1">
                      <ShimmeringLoader />
                      <ShimmeringLoader className="w-3/4" />
                    </div>
                  ) : (
                    <CommandEmpty_Shadcn_>No snippets found</CommandEmpty_Shadcn_>
                  )}
                  <CommandGroup_Shadcn_>
                    {snippets?.map((snippet) => (
                      <CommandItem_Shadcn_
                        key={snippet.id}
                        value={snippet.id}
                        className="cursor-pointer"
                        onSelect={() => {
                          if (!config?.layout.find((x) => x.id === snippet.id)) {
                            handleChartSelection({
                              metric: {
                                id: snippet.id,
                                key: `snippet_${snippet.id}`,
                                label: snippet.name,
                              },
                              isAddingChart: true,
                            })
                            sendEvent({
                              action: TelemetryActions.CUSTOM_REPORT_ADD_SQL_BLOCK_CLICKED,
                            })
                          }
                        }}
                      >
                        {snippet.name}
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      )}
    </>
  )
}
