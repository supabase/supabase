import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateHeadquartersSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.money_raised !== 'all') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  if (activeFilters.currently_monetizing !== 'all') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  headquarters,
  COUNT(*) AS total
FROM responses_2025_e${whereClause ? '\n' + whereClause : ''}
GROUP BY headquarters
ORDER BY headquarters;`
}

export function HeadquartersChart() {
  return (
    <GenericChartWithQuery
      title="Where is your startup headquartered?"
      targetColumn="headquarters"
      filterColumns={['money_raised', 'currently_monetizing']}
      generateSQLQuery={generateHeadquartersSQL}
    />
  )
}
