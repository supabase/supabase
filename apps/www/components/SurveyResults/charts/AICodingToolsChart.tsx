import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateAICodingToolsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH ai_coding_tools_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN technology IN (
          'Cursor',
          'Windsurf',
          'Cline',
          'Visual Studio Code',
          'Lovable',
          'Bolt',
          'v0',
          'Tempo',
          'None'
        ) THEN technology
        WHEN LOWER(technology) LIKE '%claude%' THEN 'Claude or Claude Code'
        WHEN LOWER(technology) = 'chatgpt' THEN 'ChatGPT'
        ELSE 'Other'
      END AS technology_clean
    FROM (
      SELECT id, unnest(ai_coding_tools) AS technology
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    technology_clean AS technology,
    COUNT(DISTINCT id) AS total
  FROM ai_coding_tools_mapping
  GROUP BY technology_clean
  ORDER BY total DESC;`
}

export function AICodingToolsChart() {
  return (
    <SurveyChart
      title="Which AI coding tools do you use?"
      targetColumn="ai_coding_tools"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_ai_coding_tools_stats"
      generateSQLQuery={generateAICodingToolsSQL}
    />
  )
}
