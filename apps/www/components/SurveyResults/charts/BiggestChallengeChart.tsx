import { SurveyChart } from '../SurveyChart'

// Generate SQL query for team count chart
function generateBiggestChallengeSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`biggest_challenge IS NOT NULL`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
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
    <SurveyChart
      title="What’s the biggest business challenge your startup is facing today?"
      targetColumn="biggest_challenge"
      filterColumns={['person_age', 'headquarters', 'money_raised']}
      generateSQLQuery={generateBiggestChallengeSQL}
    />
  )
}
