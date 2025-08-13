import { SurveyChart } from '../SurveyChart'

function generateInitialPayingCustomersSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  // whereClauses.push(`initial_paying_customers IS NOT NULL`)
  // whereClauses.push(`initial_paying_customers != ''`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  source,
  COUNT(DISTINCT id) AS respondents
FROM (
  SELECT id, unnest(initial_paying_customers) AS source
  FROM responses_2025${whereClause ? '\n' + whereClause : ''}
) sub
GROUP BY source
ORDER BY respondents DESC;`
}

export function InitialPayingCustomersChart() {
  return (
    <SurveyChart
      title="Where did your startup’s initial paying customers come from?"
      targetColumn="initial_paying_customers"
      filterColumns={['person_age', 'headquarters', 'team_count']}
      generateSQLQuery={generateInitialPayingCustomersSQL}
    />
  )
}
