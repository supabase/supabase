import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generatePreviousCompanySQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`previous_company IS NOT NULL`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = `WHERE ${whereClauses.join('\n  AND ')}`

  return `SELECT
  CASE 
    WHEN previous_company = true THEN 'Yes'
    WHEN previous_company = false THEN 'No'
    -- ELSE 'Unknown'
  END AS previous_company,
  COUNT(*) AS total
FROM responses_2025_e
${whereClause}
GROUP BY previous_company
ORDER BY total DESC;`
}

export function PreviousCompanyChart() {
  return (
    <GenericChartWithQuery
      title="Had you started a company before your current startup?"
      targetColumn="previous_company"
      filterColumns={['person_age', 'money_raised']}
      generateSQLQuery={generatePreviousCompanySQL}
      chartType="pie"
    />
  )
}
