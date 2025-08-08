import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateMustHaveDevToolsSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`must_have_dev_tools IS NOT NULL`)
  whereClauses.push(`must_have_dev_tools != ''`)

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
  must_have_dev_tools,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY must_have_dev_tools
ORDER BY total DESC
LIMIT 100;`
}

export function MustHaveDevToolsChart() {
  return (
    <GenericChartWithQuery
      title="What are your must-have dev tools?"
      targetColumn="must_have_dev_tools"
      filterColumns={['currently_monetizing', 'money_raised', 'backend_stack']}
      generateSQLQuery={generateMustHaveDevToolsSQL}
    />
  )
}
