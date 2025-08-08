import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateTechnicalFoundersSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`founders_are_technical IS NOT NULL`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = `WHERE ${whereClauses.join('\n  AND ')}`

  return `SELECT
  CASE 
    WHEN founders_are_technical = true THEN 'Yes'
    WHEN founders_are_technical = false THEN 'No'
    -- ELSE 'Unknown'
  END AS founders_are_technical,
  COUNT(*) AS total
FROM responses_2025
${whereClause}
GROUP BY founders_are_technical
ORDER BY total DESC;`
}

export function TechnicalFoundersChart() {
  return (
    <GenericChartWithQuery
      title="Are the founder(s) at your current startup technical?"
      targetColumn="founders_are_technical"
      filterColumns={['person_age', 'money_raised']}
      generateSQLQuery={generateTechnicalFoundersSQL}
      chartType="pie"
    />
  )
}
