import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Generate SQL query for team count chart
function generateWorldOutlookSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  world_outlook, 
  COUNT(*) AS total
  --ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY world_outlook
ORDER BY total DESC;`
}

export function WorldOutlookChart() {
  return (
    <SurveyChart
      title="Given the state of the world, are you…"
      targetColumn="world_outlook"
      filterColumns={['person_age', 'headquarters', 'money_raised']}
      generateSQLQuery={generateWorldOutlookSQL}
    />
  )
}
