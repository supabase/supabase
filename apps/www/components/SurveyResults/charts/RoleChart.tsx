import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Helper function to convert filters to the format expected by the database function
function buildFunctionParams(activeFilters: Record<string, string>) {
  const params: Record<string, any> = {}

  // Convert single values to arrays for the function parameters
  if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
    params.person_age_filter = [activeFilters.person_age]
  }
  if (activeFilters.location && activeFilters.location !== 'unset') {
    params.location_filter = [activeFilters.location]
  }
  if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
    params.money_raised_filter = [activeFilters.money_raised]
  }

  return params
}

function generateRoleSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  CASE 
    WHEN role = 'Founder / Co-founder' THEN 'Founder'
    WHEN role IN ('Engineer', 'Founder / Co-founder') THEN role
    ELSE 'Other'
  END AS role, 
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY CASE 
    WHEN role = 'Founder / Co-founder' THEN 'Founder'
    WHEN role IN ('Engineer', 'Founder / Co-founder') THEN role
    ELSE 'Other'
  END
ORDER BY total DESC;
`
}

export function RoleChart() {
  return (
    <SurveyChart
      title="What is your functional role at your startup?"
      targetColumn="role"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_role_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateRoleSQL}
    />
  )
}
