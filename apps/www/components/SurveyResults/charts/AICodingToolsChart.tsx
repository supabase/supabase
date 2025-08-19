import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateAICodingToolsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `
SELECT 
  unnest(ai_coding_tools) AS technology,
  COUNT(*) AS total
FROM responses_b_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function AICodingToolsChart() {
  return (
    <SurveyChart
      title="Which AI coding tools do you use?"
      targetColumn="ai_coding_tools"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateAICodingToolsSQL}
    />
  )
}
