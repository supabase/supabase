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
ORDER BY total DESC;
`
}

function transformRoleData(data: any[]) {
  // Raw data from Supabase: [{ role: 'Founder / Co-founder' }, { role: 'Engineer' }, ...]
  // Need to apply CASE logic and aggregate by counting occurrences
  const roleCounts: Record<string, number> = {}

  data.forEach((row) => {
    const role = row.role
    if (role) {
      let cleanRole = role

      if (role === 'Founder / Co-founder') {
        cleanRole = 'Founder'
      } else if (!['Engineer', 'Founder / Co-founder'].includes(role)) {
        cleanRole = 'Other'
      }

      roleCounts[cleanRole] = (roleCounts[cleanRole] || 0) + 1
    }
  })

  // Convert to array format and sort by count descending
  return Object.entries(roleCounts)
    .map(([role, total]) => ({ label: role, total }))
    .sort((a, b) => b.total - a.total)
}

export function RoleChart() {
  return (
    <SurveyChart
      title="What is your functional role at your startup?"
      targetColumn="role"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateRoleSQL}
      transformData={transformRoleData}
    />
  )
}
