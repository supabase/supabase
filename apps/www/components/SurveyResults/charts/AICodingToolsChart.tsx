import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Helper function to convert filters to the format expected by the database function
function buildFunctionParams(activeFilters: Record<string, string>) {
  const params: Record<string, any> = {}

  // Convert single values to arrays for the function parameters
  if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
    params.person_age_filter = [activeFilters.person_age]
  }
  if (activeFilters.team_size && activeFilters.team_size !== 'unset') {
    params.team_size_filter = [activeFilters.team_size]
  }
  if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
    params.money_raised_filter = [activeFilters.money_raised]
  }

  return params
}

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
      functionParams={buildFunctionParams}
      generateSQLQuery={generateAICodingToolsSQL}
    />
  )
}
