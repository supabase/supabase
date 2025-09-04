import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateWorldOutlookSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  world_outlook, 
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY world_outlook
ORDER BY total DESC;`
}

export function WorldOutlookChart() {
  return (
    <SurveyChart
      title="Given the state of the world, are you…"
      targetColumn="world_outlook"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_world_outlook_stats"
      generateSQLQuery={generateWorldOutlookSQL}
    />
  )
}
