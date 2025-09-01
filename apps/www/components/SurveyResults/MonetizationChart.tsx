import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateMonetizationSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  currently_monetizing,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY currently_monetizing
ORDER BY total DESC;`
}

export function MonetizationChart() {
  return (
    <GenericChartWithQuery
      title="Is your startup monetizing today?"
      targetColumn="currently_monetizing"
      filterColumns={['headquarters', 'money_raised']}
      generateSQLQuery={generateMonetizationSQL}
      chartType="pie"
    />
  )
}
