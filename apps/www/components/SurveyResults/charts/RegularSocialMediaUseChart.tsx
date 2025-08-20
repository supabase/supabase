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

function generateRegularSocialMediaUseSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH regular_social_media_use_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN platform IN (
          'X (Twitter)',
          'Threads',
          'BlueSky',
          'LinkedIn',
          'Reddit',
          'TikTok',
          'Instagram',
          'YouTube',
          'Mastodon',
          'Discord',
          'I’ve given up social media'
        ) THEN platform
        ELSE 'Other'
      END AS platform_clean
    FROM (
      SELECT id, unnest(regular_social_media_use) AS platform
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    platform_clean AS platform,
    COUNT(DISTINCT id) AS total
  FROM regular_social_media_use_mapping
  GROUP BY platform_clean
  ORDER BY total DESC;`
}

export function RegularSocialMediaUseChart() {
  return (
    <SurveyChart
      title="Which social media platforms do you use at least 3× per week?"
      targetColumn="regular_social_media_use"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_regular_social_media_use_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateRegularSocialMediaUseSQL}
    />
  )
}
