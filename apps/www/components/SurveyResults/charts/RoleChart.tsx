import { SurveyChart } from '../SurveyChart'

// Generate SQL query for team count chart
function generateRoleSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }
  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }
  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

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

// SELECT
//   person_role_normalized,
//   COUNT(*) AS total
// FROM responses_2025${whereClause ? '\n' + whereClause : ''}
// GROUP BY person_role_normalized
// ORDER BY total DESC

export function RoleChart() {
  return (
    <SurveyChart
      title="What is your functional role at your startup?"
      targetColumn="person_role_normalized"
      filterColumns={['person_age', 'headquarters', 'money_raised']}
      generateSQLQuery={generateRoleSQL}
    />
  )
}
