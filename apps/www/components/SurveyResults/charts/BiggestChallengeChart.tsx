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

// Custom aggregate function for biggest challenge data
async function aggregateBiggestChallengeData(
  activeFilters: Record<string, string>,
  supabaseClient: any
) {
  const specificChallenges = [
    'Customer acquisition',
    'Technical complexity',
    'Product-market fit',
    'Fundraising',
    'Hiring',
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific challenge
  for (const challenge of specificChallenges) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .eq('biggest_challenge', challenge)

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${challenge}:`, countError)
      continue
    }

    categoryCounts[challenge] = count || 0
  }

  // Get count for "Other" (everything not in our specific categories)
  let otherQuery = supabaseClient
    .from('responses_2025')
    .select('*', { count: 'exact', head: true })
    .not('biggest_challenge', 'in', specificChallenges)

  // Apply additional filters
  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== 'unset') {
      otherQuery = otherQuery.eq(column, value)
    }
  }

  const { count: otherCount, error: otherError } = await otherQuery

  if (!otherError && otherCount) {
    categoryCounts['Other'] = otherCount
  }

  // Convert to array format and sort by count descending
  return Object.entries(categoryCounts)
    .map(([challenge, total]) => ({ label: challenge, total }))
    .sort((a, b) => b.total - a.total)
}

export function BiggestChallengeChart() {
  return (
    <SurveyChart
      title="What is your biggest challenge right now?"
      targetColumn="biggest_challenge"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateBiggestChallengeSQL}
      customAggregateFunction={aggregateBiggestChallengeData}
    />
  )
}
