import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generateBiggestChallengeSQL(activeFilters) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`biggest_challenge IS NOT NULL`)

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  if (activeFilters.ai_models_used !== 'unset') {
    whereClauses.push(`'${activeFilters.ai_models_used}' = ANY(ai_models_used)`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `WITH biggest_challenge_mapping AS (
  SELECT 
    biggest_challenge,
    CASE 
      -- WHEN biggest_challenge = 'Customer acquisition' THEN 'Acquisition'
      -- WHEN biggest_challenge = 'Technical complexity' THEN 'Technical'
      WHEN biggest_challenge IN ('Customer acquisition', 'Technical complexity', 'Product-market fit', 'Product-market fit', 'Fundraising', 'Hiring', 'Other') THEN biggest_challenge
      ELSE 'Other'
    END AS biggest_challenge_clean
  FROM responses_2025
  ${whereClause}
)
SELECT 
  biggest_challenge_clean AS biggest_challenge,
  COUNT(*) AS total
FROM biggest_challenge_mapping
GROUP BY biggest_challenge_clean
ORDER BY total DESC;`
}

export function BiggestChallengeChart() {
  return (
    <GenericChartWithQuery
      title="What’s the biggest business challenge your startup is facing today?"
      targetColumn="biggest_challenge"
      filterColumns={['team_count', 'ai_models_used', 'currently_monetizing']}
      generateSQLQuery={generateBiggestChallengeSQL}
    />
  )
}
