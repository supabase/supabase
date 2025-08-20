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

// Custom aggregate function for AI coding tools data
async function aggregateAICodingToolsData(
  activeFilters: Record<string, string>,
  supabaseClient: any
) {
  const specificTechnologies = [
    'Cursor',
    'Windsurf',
    'Cline',
    'Visual Studio Code',
    'Lovable',
    'Bolt',
    'v0',
    'Tempo',
    'None',
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific technology
  for (const technology of specificTechnologies) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .contains('ai_coding_tools', [technology])

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

  // Get count for "Claude or Claude Code" (case-insensitive search)
  let claudeQuery = supabaseClient
    .from('responses_2025')
    .select('*', { count: 'exact', head: true })
    .or(
      'ai_coding_tools.cs.@>.["claude"],ai_coding_tools.cs.@>.["Claude"],ai_coding_tools.cs.@>.["CLAUDE"]'
    )

  // Apply additional filters
  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== 'unset') {
      claudeQuery = claudeQuery.eq(column, value)
    }
  }

  const { count: claudeCount, error: claudeError } = await claudeQuery

  if (!claudeError && claudeCount) {
    categoryCounts['Claude or Claude Code'] = claudeCount
  }

  // Get count for "ChatGPT" (case-insensitive search)
  let chatgptQuery = supabaseClient
    .from('responses_2025')
    .select('*', { count: 'exact', head: true })
    .or(
      'ai_coding_tools.cs.@>.["chatgpt"],ai_coding_tools.cs.@>.["ChatGPT"],ai_coding_tools.cs.@>.["CHATGPT"]'
    )

  // Apply additional filters
  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== 'unset') {
      chatgptQuery = chatgptQuery.eq(column, value)
    }
  }

  const { count: chatgptCount, error: chatgptError } = await chatgptQuery

  if (!chatgptError && chatgptCount) {
    categoryCounts['ChatGPT'] = chatgptCount
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

export function AICodingToolsChart() {
  return (
    <SurveyChart
      title="Which AI coding tools do you use?"
      targetColumn="ai_coding_tools"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateAICodingToolsSQL}
      customAggregateFunction={aggregateAICodingToolsData}
    />
  )
}
