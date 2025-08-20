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

function transformBiggestChallengeData(data: any[]) {
  // Raw data from Supabase: [{ biggest_challenge: 'Customer acquisition' }, { biggest_challenge: 'Technical complexity' }, ...]
  // Need to apply CASE logic and aggregate by counting occurrences
  const challengeCounts: Record<string, number> = {}

  data.forEach((row) => {
    const challenge = row.biggest_challenge
    if (challenge) {
      let cleanChallenge = challenge

      if (
        ![
          'Customer acquisition',
          'Technical complexity',
          'Product-market fit',
          'Fundraising',
          'Hiring',
          'Other',
        ].includes(challenge)
      ) {
        cleanChallenge = 'Other'
      }

      challengeCounts[cleanChallenge] = (challengeCounts[cleanChallenge] || 0) + 1
    }
  })

  // Convert to array format and sort by count descending
  return Object.entries(challengeCounts)
    .map(([biggest_challenge, total]) => ({ label: biggest_challenge, total }))
    .sort((a, b) => b.total - a.total)
}

export function BiggestChallengeChart() {
  return (
    <SurveyChart
      targetColumn="biggest_challenge"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateBiggestChallengeSQL}
      transformData={transformBiggestChallengeData}
    />
  )
}
