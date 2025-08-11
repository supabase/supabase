import { FormHeader } from 'components/ui/Forms/FormHeader'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { QueryInsights } from './QueryInsights'

const QueryInsightsPage = () => {
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
        <QueryInsights />
      </div>
    </div>
  )
}

export default QueryInsightsPage
