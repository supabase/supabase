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

function generateAIModelsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH ai_models_used_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN technology IN (
          'OpenAI',
          'Anthropic/Claude',
          'Hugging Face',
          'Custom models',
          'SageMaker',
          'Bedrock',
          'Cohere',
          'Mistral'
        ) THEN technology
        WHEN LOWER(technology) LIKE '%gemini%' THEN 'Gemini'
        WHEN LOWER(technology) = 'deepseek' THEN 'DeepSeek'
        ELSE 'Other'
      END AS technology_clean
    FROM (
      SELECT id, unnest(ai_models_used) AS technology
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    technology_clean AS technology,
    COUNT(DISTINCT id) AS total
  FROM ai_models_used_mapping
  GROUP BY technology_clean
  ORDER BY total DESC;`
}

export function AIModelsChart() {
  return (
    <SurveyChart
      title="Which AI models are you using or planning to use?"
      targetColumn="ai_models_used"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_ai_models_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateAIModelsSQL}
    />
  )
}
