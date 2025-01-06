import { Home } from 'lucide-react'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { METRICS, METRIC_CATEGORIES } from 'lib/constants/metrics'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

interface MetricOptionsProps {
  config: any
  handleChartSelection: any
}

export const MetricOptions = ({ config, handleChartSelection }: MetricOptionsProps) => {
  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])

  const metricCategories = Object.values(METRIC_CATEGORIES).filter(({ key }) => {
    if (key === 'api_auth') return authEnabled
    if (key === 'api_storage') return storageEnabled
    return true
  })

  return metricCategories.map((cat) => {
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
                  onCheckedChange={(e) => handleChartSelection({ metric, value: e })}
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
  })
}
