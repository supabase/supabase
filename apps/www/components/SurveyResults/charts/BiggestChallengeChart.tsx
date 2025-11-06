import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateBiggestChallengeSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, ['biggest_challenge IS NOT NULL'])

  return `WITH biggest_challenge_mapping AS (
  SELECT 
    biggest_challenge,
    CASE 
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
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_biggest_challenge_stats"
      generateSQLQuery={generateBiggestChallengeSQL}
    />
  )
}
