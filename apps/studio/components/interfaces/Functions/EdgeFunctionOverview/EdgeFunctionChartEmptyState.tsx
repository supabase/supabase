import { BarChart2Icon } from 'lucide-react'
import { ChartEmptyState } from 'ui-patterns/Chart'

interface EdgeFunctionChartEmptyStateProps {
  title: string
  description?: string
}

export const EdgeFunctionChartEmptyState = ({
  title,
  description,
}: EdgeFunctionChartEmptyStateProps) => {
  return (
    <ChartEmptyState
      icon={<BarChart2Icon size={16} />}
      title={title}
      description={description ?? 'It may take up to 24 hours for data to refresh'}
    />
  )
}
