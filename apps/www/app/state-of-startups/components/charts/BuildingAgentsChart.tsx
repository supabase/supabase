import { buildWhereClause, SurveyChart } from '../SurveyChart'

function generateBuildingAgentsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, ['building_ai_agents IS NOT NULL'])

  return `SELECT
  building_ai_agents AS answer,
  COUNT(*) AS total
FROM responses_2026
${whereClause}
GROUP BY building_ai_agents
ORDER BY total DESC;`
}

export function BuildingAgentsChart() {
  return (
    <SurveyChart
      title="Are you building or planning to build AI agents?"
      targetColumn="building_ai_agents"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_building_ai_agents_stats"
      newInYear={2026}
      generateSQLQuery={generateBuildingAgentsSQL}
    />
  )
}
