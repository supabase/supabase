import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateDataWarehousesSQL(activeFilters: Record<string, string>) {
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

  if (activeFilters.frontend_stack !== 'unset') {
    whereClauses.push(`'${activeFilters.frontend_stack}' = ANY(frontend_stack)`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
WITH expanded AS (
  SELECT unnest(data_warehouses) AS technology
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
)
SELECT 
  technology,
  COUNT(*) AS total
FROM expanded
WHERE technology NOT IN ('We don''t use a data warehouse', 'Not sure')
GROUP BY technology
ORDER BY total DESC;
`
}

export function DataWarehousesChart() {
  return (
    <GenericChartWithQuery
      title="Which data warehouse(s) is your startup using? (Filtered)"
      targetColumn="data_warehouses"
      filterColumns={['headquarters', 'industry_normalized', 'person_age', 'frontend_stack']}
      generateSQLQuery={generateDataWarehousesSQL}
    />
  )
}
