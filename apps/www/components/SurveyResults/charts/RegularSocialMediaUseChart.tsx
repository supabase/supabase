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
          'I've given up social media'
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

function transformRegularSocialMediaUseData(data: any[]) {
  // Raw data from Supabase: [{ id: 1, regular_social_media_use: ['platform1', 'platform2'] }, ...]
  // Need to flatten array data and apply CASE logic
  const platformCounts: Record<string, number> = {}

  data.forEach((row) => {
    const platforms = row.regular_social_media_use || []
    platforms.forEach((platform: string) => {
      let cleanPlatform = platform
      if (
        ![
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
          "I've given up social media",
        ].includes(platform)
      ) {
        cleanPlatform = 'Other'
      }

      platformCounts[cleanPlatform] = (platformCounts[cleanPlatform] || 0) + 1
    })
  })

  // Convert to array format and sort by count descending
  return Object.entries(platformCounts)
    .map(([platform, total]) => ({ label: platform, total }))
    .sort((a, b) => b.total - a.total)
}

export function RegularSocialMediaUseChart() {
  return (
    <SurveyChart
      title="Which social media platforms do you use at least 3× per week?"
      targetColumn="regular_social_media_use"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateRegularSocialMediaUseSQL}
      transformData={transformRegularSocialMediaUseData}
    />
  )
}
