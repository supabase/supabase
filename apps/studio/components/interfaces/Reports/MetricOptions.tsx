import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useContentQuery } from 'data/content/content-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Metric, METRIC_CATEGORIES, METRICS } from 'lib/constants/metrics'
import { Home, Plus } from 'lucide-react'
import { useState } from 'react'
import { editorPanelState } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import type { Dashboards } from 'types'
import {
  Command_Shadcn_,
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
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DEPRECATED_REPORTS } from './Reports.constants'

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
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { openSidebar } = useSidebarManagerSnapshot()
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
              {cat.icon ? cat.icon() : <Home size={14} />}
              <p>{cat.label}</p>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {METRICS.filter(
                  (metric) =>
                    !DEPRECATED_REPORTS.includes(metric.key) && metric?.category?.key === cat.key
                ).map((metric) => {
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
                ) : !snippets?.length ? (
                  <p className="text-xs text-center text-foreground-lighter py-3">
                    No snippets found
                  </p>
                ) : null}
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
                            action: 'custom_report_add_sql_block_clicked',
                            groups: {
                              project: projectRef ?? 'Unknown',
                              organization: selectedOrganization?.slug ?? 'Unknown',
                            },
                          })
                        }
                      }}
                    >
                      {snippet.name}
                    </CommandItem_Shadcn_>
                  ))}
                </CommandGroup_Shadcn_>
              </CommandList_Shadcn_>

              <div className="h-px bg-border-overlay -mx-1" />

              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    editorPanelState.openAsNew()
                    openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
                  }}
                >
                  <div className="w-full flex items-center gap-2">
                    <Plus size={14} strokeWidth={1.5} />
                    <p>Create snippet</p>
                  </div>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            </Command_Shadcn_>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </>
  )
}
