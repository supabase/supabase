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

function generateNewIdeasSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH new_ideas_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN avenue IN (
          'Hacker News',
          'GitHub',
          'Product Hunt',
          'Twitter/X',
          'Reddit',
          'YouTube',
          'Podcasts',
          'Blogs / Newsletters',
          'Discord / Slack communities',
          'Conferences / Meetups'
        ) THEN avenue
        ELSE 'Other'
      END AS avenue_clean
    FROM (
      SELECT id, unnest(new_ideas) AS avenue
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    avenue_clean AS avenue,
    COUNT(DISTINCT id) AS total
  FROM new_ideas_mapping
  GROUP BY avenue_clean
  ORDER BY total DESC;`
}

export function NewIdeasChart() {
  return (
    <SurveyChart
      title="Where do you usually discover new dev tools or startup ideas?"
      targetColumn="new_ideas"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_new_ideas_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateNewIdeasSQL}
    />
  )
}
