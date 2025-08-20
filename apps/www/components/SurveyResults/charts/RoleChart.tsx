import { SurveyChart, buildWhereClause, createCategoryAggregator } from '../SurveyChart'

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

// Custom aggregate function that respects role grouping logic
function aggregateRoleData(activeFilters: Record<string, string>, supabaseClient: any) {
  // Define the specific categories we want to track
  const specificRoles = ['Founder / Co-founder', 'Engineer']

  // Define how to map the raw values to display values
  const roleMappings = {
    'Founder / Co-founder': 'Founder',
  }

  // Use the helper function to create our custom aggregator
  const roleAggregator = createCategoryAggregator('role', specificRoles, roleMappings)

  return roleAggregator(activeFilters, supabaseClient)
}

export function RoleChart() {
  return (
    <SurveyChart
      title="What is your functional role at your startup?"
      targetColumn="role"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateRoleSQL}
      customAggregateFunction={aggregateRoleData}
    />
  )
}
