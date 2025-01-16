import { Code, Home } from 'lucide-react'

import { useParams } from 'common'
import { useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useFlag } from 'hooks/ui/useFlag'
import { Metric, METRIC_CATEGORIES, METRICS } from 'lib/constants/metrics'
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
} from 'ui'

interface MetricOptionsProps {
  config: any
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

  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])

  const metricCategories = Object.values(METRIC_CATEGORIES).filter(({ key }) => {
    if (key === 'api_auth') return authEnabled
    if (key === 'api_storage') return storageEnabled
    return true
  })

  // [Joshen] UX for selecting a SQL snippet will be kinda weird as we currently don't have an endpoint
  // that can return the snippets as a flat list (some snippets could be within folders)
  const { data, isLoading } = useSQLSnippetFoldersQuery(
    { projectRef, sort: 'name' },
    { keepPreviousData: true }
  )
  const snippets = data?.pages[0].contents
  const folders = data?.pages[0].folders

  return (
    <>
      {metricCategories.map((cat) => {
        return (
          <DropdownMenuSub key={cat.key}>
            <DropdownMenuSubTrigger className="space-x-2">
              {cat.icon ? cat.icon : <Home size={14} />}
              <p>{cat.label}</p>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {METRICS.filter((metric) => metric?.category?.key === cat.key).map((metric) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={metric.key}
                      checked={config.layout?.some((x: any) => x.attribute === metric.key)}
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
            <Code size={14} />
            <p>SQL Snippets</p>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="p-0">
              <Command_Shadcn_>
                <CommandInput_Shadcn_ autoFocus placeholder="Search snippets..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No snippets found</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    {snippets?.map((snippet) => (
                      <CommandItem_Shadcn_
                        key={snippet.id}
                        value={snippet.id}
                        onSelect={() => {
                          handleChartSelection({
                            metric: {
                              id: snippet.id,
                              key: `snippet_${snippet.id}`,
                              label: snippet.name,
                              isSnippet: true,
                            },
                            isAddingChart: true,
                          })
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
