import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateProblemBeingSolvedSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`problem_solving IS NOT NULL`)
  whereClauses.push(`problem_solving != ''`)

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  if (activeFilters.backend_stack !== 'unset') {
    whereClauses.push(`'${activeFilters.backend_stack}' = ANY(backend_stack)`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
SELECT
  problem_solving,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY problem_solving
ORDER BY total DESC
LIMIT 100;`
}

export function ProblemBeingSolvedChart() {
  return (
    <GenericChartWithQuery
      title="What problem is your startup solving?"
      targetColumn="problem_solving"
      filterColumns={['currently_monetizing', 'money_raised', 'backend_stack']}
      generateSQLQuery={generateProblemBeingSolvedSQL}
    />
  )
}
