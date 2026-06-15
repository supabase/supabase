import { BarChart2 } from 'lucide-react'
import { ChartEmptyState } from 'ui-patterns/Chart'

export const SqlEditorResultsEmptyState = () => (
  <div className="flex h-full min-h-0 items-center justify-center p-4">
    <ChartEmptyState
      className="h-full w-full"
      icon={<BarChart2 size={16} />}
      title="No data to show"
      description="Execute a query and configure the chart options."
    />
  </div>
)
