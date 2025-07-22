import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generateIndustrySQL(activeFilters) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`industry_normalized IS NOT NULL`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }
  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  industry_normalized,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY industry_normalized
ORDER BY total DESC;`
}

export function IndustryChart() {
  return (
    <GenericChartWithQuery
      title="What is your startup's primary industry or target customer segment?"
      targetColumn="industry_normalized"
      filterColumns={['person_age', 'headquarters']}
      generateSQLQuery={generateIndustrySQL}
    />
  )
}
