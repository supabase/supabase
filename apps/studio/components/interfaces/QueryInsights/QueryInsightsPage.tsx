import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import { MetricsOverview } from './components/MetricsOverview'
import { QueryList } from './components/QueryList'
import dayjs from 'dayjs'

export type MetricType = 'rows_read' | 'rows_written' | 'query_latency' | 'queries_per_second'

const QueryInsightsPage = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('rows_read')
  const [timeRange, setTimeRange] = useState({
    startDate: dayjs().subtract(24, 'hour'),
    endDate: dayjs(),
  })

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Query Insights"
        description="Monitor and analyze query performance across your database"
        docsUrl="https://supabase.com/docs/guides/platform/performance"
        actions={<DatabaseSelector />}
      />

      <div className="flex flex-col flex-grow">
        <MetricsOverview
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
        <QueryList timeRange={timeRange} />
      </div>
    </div>
  )
}

export default QueryInsightsPage
