import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateHeadquartersSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  if (activeFilters.startup_age !== 'unset') {
    whereClauses.push(`startup_age = '${activeFilters.startup_age}'`)
  }

  if (activeFilters.previous_company !== 'unset') {
    // Convert string to boolean for the SQL query
    const previousCompanyBool = activeFilters.previous_company === 'true'
    whereClauses.push(`previous_company = ${previousCompanyBool}`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  headquarters,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY headquarters
ORDER BY total DESC;`
}

export function HeadquartersChart() {
  return (
    <GenericChartWithQuery
      title="Where is your startup headquartered?"
      targetColumn="headquarters"
      filterColumns={['funding_stage', 'startup_age', 'previous_company']}
      generateSQLQuery={generateHeadquartersSQL}
    />
  )
}
