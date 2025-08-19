import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateInitialPayingCustomersSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  source,
  COUNT(DISTINCT id) AS respondents
FROM (
  SELECT id, unnest(initial_paying_customers) AS source
  FROM responses_c_2025${whereClause ? '\n' + whereClause : ''}
) sub
GROUP BY source
ORDER BY respondents DESC;`
}

export function InitialPayingCustomersChart() {
  return (
    <SurveyChart
      title="Where did your startup’s initial paying customers come from?"
      targetColumn="initial_paying_customers"
      filterColumns={['person_age', 'location', 'team_size']}
      generateSQLQuery={generateInitialPayingCustomersSQL}
    />
  )
}
