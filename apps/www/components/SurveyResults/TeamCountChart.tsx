import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generateTeamCountSQL(activeFilters) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  team_count,
  COUNT(*) AS total
FROM responses_2025_e${whereClause ? '\n' + whereClause : ''}
GROUP BY team_count
ORDER BY 
  CASE team_count
    WHEN '1-10' THEN 1
    WHEN '11-50' THEN 2
    WHEN '51-100' THEN 3
    WHEN '101-250' THEN 4
    WHEN '250' THEN 5
  END;`
}

export function TeamCountChart() {
  return (
    <GenericChartWithQuery
      title="How many full-time employees does your startup have?"
      targetColumn="team_count"
      filterColumns={['headquarters', 'funding_stage', 'person_age']}
      generateSQLQuery={generateTeamCountSQL}
    />
  )
}
