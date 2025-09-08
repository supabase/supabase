import { SurveyChart, buildWhereClause } from '../SurveyChart'

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
ORDER BY total DESC;`
}

export function RoleChart() {
  return (
    <SurveyChart
      title="What is your functional role at your startup?"
      targetColumn="role"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_role_stats"
      generateSQLQuery={generateRoleSQL}
    />
  )
}
