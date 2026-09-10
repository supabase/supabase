import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateLocationSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT
  location,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY location
ORDER BY total DESC;`
}

export function LocationChart() {
  return (
    <SurveyChart
      title="Where is your startup headquartered?"
      targetColumn="location"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_location_stats"
      generateSQLQuery={generateLocationSQL}
    />
  )
}
