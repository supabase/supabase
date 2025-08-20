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

// Custom aggregate function for AI models data
async function aggregateAIModelsData(activeFilters: Record<string, string>, supabaseClient: any) {
  const specificTechnologies = [
    'OpenAI',
    'Anthropic/Claude',
    'Hugging Face',
    'Custom models',
    'SageMaker',
    'Bedrock',
    'Cohere',
    'Mistral',
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific technology
  for (const technology of specificTechnologies) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .contains('ai_models_used', [technology])

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${technology}:`, countError)
      continue
    }

    categoryCounts[technology] = count || 0
  }

  // Get count for "Gemini" (case-insensitive search)
  let geminiQuery = supabaseClient
    .from('responses_2025')
    .select('*', { count: 'exact', head: true })
    .or(
      'ai_models_used.cs.@>.["gemini"],ai_models_used.cs.@>.["Gemini"],ai_models_used.cs.@>.["GEMINI"]'
    )

  // Apply additional filters
  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== 'unset') {
      geminiQuery = geminiQuery.eq(column, value)
    }
  }

  const { count: geminiCount, error: geminiError } = await geminiQuery

  if (!geminiError && geminiCount) {
    categoryCounts['Gemini'] = geminiCount
  }

  // Get count for "DeepSeek" (case-insensitive search)
  let deepseekQuery = supabaseClient
    .from('responses_2025')
    .select('*', { count: 'exact', head: true })
    .or(
      'ai_models_used.cs.@>.["deepseek"],ai_models_used.cs.@>.["DeepSeek"],ai_models_used.cs.@>.["DEEPSEEK"]'
    )

  // Apply additional filters
  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== 'unset') {
      deepseekQuery = deepseekQuery.eq(column, value)
    }
  }

  const { count: deepseekCount, error: deepseekError } = await deepseekQuery

  if (!deepseekError && deepseekCount) {
    categoryCounts['DeepSeek'] = deepseekCount
  }

  // Get count for "Other" (everything not in our specific categories)
  // This is complex for array fields, so we'll calculate it as total - known categories
  try {
    let totalQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        totalQuery = totalQuery.eq(column, value)
      }
    }

    const { count: totalCount, error: totalError } = await totalQuery

    if (!totalError && totalCount) {
      const knownCategoriesTotal = Object.values(categoryCounts).reduce(
        (sum, count) => sum + count,
        0
      )
      const otherCount = totalCount - knownCategoriesTotal

      if (otherCount > 0) {
        categoryCounts['Other'] = otherCount
      }
    }
  } catch (fallbackError) {
    console.error('Fallback "Other" calculation failed:', fallbackError)
  }

  // Convert to array format and sort by count descending
  return Object.entries(categoryCounts)
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
      customAggregateFunction={aggregateAIModelsData}
    />
  )
}
