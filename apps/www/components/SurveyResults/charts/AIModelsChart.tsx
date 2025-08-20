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

function transformAIModelsData(data: any[]) {
  // Raw data from Supabase: [{ id: 1, ai_models_used: ['tech1', 'tech2'] }, ...]
  // Need to flatten array data and apply CASE logic
  const technologyCounts: Record<string, number> = {}

  data.forEach((row) => {
    const technologies = row.ai_models_used || []
    technologies.forEach((technology: string) => {
      let cleanTechnology = technology

      if (
        [
          'OpenAI',
          'Anthropic/Claude',
          'Hugging Face',
          'Custom models',
          'SageMaker',
          'Bedrock',
          'Cohere',
          'Mistral',
        ].includes(technology)
      ) {
        cleanTechnology = technology
      } else if (technology.toLowerCase().includes('gemini')) {
        cleanTechnology = 'Gemini'
      } else if (technology.toLowerCase() === 'deepseek') {
        cleanTechnology = 'DeepSeek'
      } else {
        cleanTechnology = 'Other'
      }

      technologyCounts[cleanTechnology] = (technologyCounts[cleanTechnology] || 0) + 1
    })
  })

  // Convert to array format and sort by count descending
  return Object.entries(technologyCounts)
    .map(([technology, total]) => ({ label: technology, total }))
    .sort((a, b) => b.total - a.total)
}

export function AIModelsChart() {
  return (
    <SurveyChart
      title="Which AI models are you using or planning to use?"
      targetColumn="ai_models_used"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateAIModelsSQL}
      transformData={transformAIModelsData}
    />
  )
}
