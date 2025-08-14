import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateHeadquartersSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT
  headquarters,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY headquarters
ORDER BY total DESC;`
}

export function HeadquartersChart() {
  return (
    <SurveyChart
      title="Where is your startup headquartered?"
      targetColumn="headquarters"
      filterColumns={['person_age', 'team_count', 'money_raised']}
      generateSQLQuery={generateHeadquartersSQL}
    />
  )
}
