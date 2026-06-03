import { BarChart2 } from 'lucide-react'
import { ChartEmptyState } from 'ui-patterns/Chart'

export const SqlEditorAwaitingResultsEmptyState = ({ className }: { className?: string }) => (
  <ChartEmptyState
    className={className}
    icon={<BarChart2 size={16} />}
    title="No results yet"
    description="Execute a query and configure the chart options."
  />
)
