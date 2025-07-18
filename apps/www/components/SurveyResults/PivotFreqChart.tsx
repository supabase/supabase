import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generatePivotFreqSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  pivots_before_current,
  COUNT(*) AS total
FROM responses_2025_e${whereClause ? '\n' + whereClause : ''}
GROUP BY pivots_before_current
ORDER BY total DESC;`
}

export function PivotFreqChart() {
  return (
    <GenericChartWithQuery
      title="How many times did your startup have to pivot before arriving at the current idea?"
      targetColumn="pivots_before_current"
      filterColumns={['headquarters', 'currently_monetizing']}
      generateSQLQuery={generatePivotFreqSQL}
    />
  )
}
