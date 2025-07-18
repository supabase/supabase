import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateFrontendStackSQL(activeFilters: Record<string, string>) {
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
  unnest(frontend_stack) AS technology,
  COUNT(*) AS total
FROM responses_2025_e${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function FrontendStackChart() {
  return (
    <GenericChartWithQuery
      // title="What is your startup's backend stack?'"
      title="What frontend technologies are your startup using?"
      targetColumn="frontend_stack"
      filterColumns={['headquarters', 'currently_monetizing']}
      generateSQLQuery={generateFrontendStackSQL}
    />
  )
}
