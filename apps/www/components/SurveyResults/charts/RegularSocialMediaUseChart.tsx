import { SurveyChart, buildWhereClause } from '../SurveyChart'

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
      generateSQLQuery={generateRegularSocialMediaUseSQL}
    />
  )
}
