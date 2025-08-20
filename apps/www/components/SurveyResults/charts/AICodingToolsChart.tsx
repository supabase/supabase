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

function transformAICodingToolsData(data: any[]) {
  // Raw data from Supabase: [{ id: 1, ai_coding_tools: ['tech1', 'tech2'] }, ...]
  // Need to flatten array data and apply CASE logic
  const technologyCounts: Record<string, number> = {}

  data.forEach((row) => {
    const technologies = row.ai_coding_tools || []
    technologies.forEach((technology: string) => {
      let cleanTechnology = technology

      if (
        [
          'Cursor',
          'Windsurf',
          'Cline',
          'Visual Studio Code',
          'Lovable',
          'Bolt',
          'v0',
          'Tempo',
          'None',
        ].includes(technology)
      ) {
        cleanTechnology = technology
      } else if (technology.toLowerCase().includes('claude')) {
        cleanTechnology = 'Claude or Claude Code'
      } else if (technology.toLowerCase() === 'chatgpt') {
        cleanTechnology = 'ChatGPT'
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

export function AICodingToolsChart() {
  return (
    <SurveyChart
      title="Which AI coding tools do you use?"
      targetColumn="ai_coding_tools"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateAICodingToolsSQL}
      transformData={transformAICodingToolsData}
    />
  )
}
