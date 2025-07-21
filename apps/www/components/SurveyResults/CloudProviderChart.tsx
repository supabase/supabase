import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateCloudProviderSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
  SELECT 
  unnest(cloud_providers) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function CloudProviderChart() {
  return (
    <GenericChartWithQuery
      // title="What is your startup's backend stack?'"
      title="Which cloud provider(s) are your startup using?"
      targetColumn="cloud_providers"
      filterColumns={['headquarters', 'currently_monetizing']}
      generateSQLQuery={generateCloudProviderSQL}
    />
  )
}
