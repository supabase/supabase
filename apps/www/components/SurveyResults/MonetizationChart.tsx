import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateMonetizationSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'all') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.money_raised !== 'all') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  currently_monetizing,
  COUNT(*) AS total
FROM responses_2025_e${whereClause ? '\n' + whereClause : ''}
GROUP BY currently_monetizing
--ORDER BY currently_monetizing
ORDER BY total DESC;`
}

export function MonetizationChart() {
  return (
    <GenericChartWithQuery
      title="Is your startup monetizing today?"
      targetColumn="currently_monetizing"
      filterColumns={['headquarters', 'money_raised']}
      generateSQLQuery={generateMonetizationSQL}
    />
  )
}
