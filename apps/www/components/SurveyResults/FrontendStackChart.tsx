import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateFrontendStackSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.industry_normalized !== 'unset') {
    whereClauses.push(`industry_normalized = '${activeFilters.industry_normalized}'`)
  }

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  unnest(frontend_stack) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function FrontendStackChart() {
  return (
    <GenericChartWithQuery
      title="What frontend technologies are your startup using?"
      targetColumn="frontend_stack"
      filterColumns={['headquarters', 'industry_normalized', 'person_age']}
      generateSQLQuery={generateFrontendStackSQL}
    />
  )
}
