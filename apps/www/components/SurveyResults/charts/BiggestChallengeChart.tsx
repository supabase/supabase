import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Helper function to convert filters to the format expected by the database function
function buildFunctionParams(activeFilters: Record<string, string>) {
  const params: Record<string, any> = {}

  // Convert single values to arrays for the function parameters
  if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
    params.person_age_filter = [activeFilters.person_age]
  }
  if (activeFilters.location && activeFilters.location !== 'unset') {
    params.location_filter = [activeFilters.location]
  }
  if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
    params.money_raised_filter = [activeFilters.money_raised]
  }

  return params
}

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
      functionParams={buildFunctionParams}
      generateSQLQuery={generateBiggestChallengeSQL}
    />
  )
}
