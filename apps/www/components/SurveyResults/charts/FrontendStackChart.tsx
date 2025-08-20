import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Helper function to convert filters to the format expected by the database function
function buildFunctionParams(activeFilters: Record<string, string>) {
  const params: Record<string, any> = {}

  // Convert single values to arrays for the function parameters
  if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
    params.person_age_filter = [activeFilters.person_age]
  }
  if (activeFilters.team_size && activeFilters.team_size !== 'unset') {
    params.team_size_filter = [activeFilters.team_size]
  }
  if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
    params.money_raised_filter = [activeFilters.money_raised]
  }

  return params
}

function generateFrontendStackSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  unnest(frontend_stack) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function FrontendStackChart() {
  return (
    <SurveyChart
      title="What frontend technologies are your startup using?"
      targetColumn="frontend_stack"
      filterColumns={['location', 'industry_normalized', 'person_age']}
      functionName="get_frontend_stack_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateFrontendStackSQL}
    />
  )
}
