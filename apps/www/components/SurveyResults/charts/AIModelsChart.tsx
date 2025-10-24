import { SurveyChart, buildWhereClause } from '../SurveyChart'

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
      generateSQLQuery={generateAIModelsSQL}
    />
  )
}
