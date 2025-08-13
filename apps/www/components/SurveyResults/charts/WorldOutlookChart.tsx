import { SurveyChart } from '../SurveyChart'

// Generate SQL query for team count chart
function generateWorldOutlookSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

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
