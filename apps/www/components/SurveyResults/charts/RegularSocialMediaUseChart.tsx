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

// Custom aggregate function for regular social media use data
async function aggregateRegularSocialMediaUseData(
  activeFilters: Record<string, string>,
  supabaseClient: any
) {
  const specificPlatforms = [
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
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific platform
  for (const platform of specificPlatforms) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .contains('regular_social_media_use', [platform])

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${platform}:`, countError)
      continue
    }

    categoryCounts[platform] = count || 0
  }

  // Get count for "Other" (everything not in our specific categories)
  // This is complex for array fields, so we'll calculate it as total - known categories
  try {
    let totalQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        totalQuery = totalQuery.eq(column, value)
      }
    }

    const { count: totalCount, error: totalError } = await totalQuery

    if (!totalError && totalCount) {
      const knownCategoriesTotal = Object.values(categoryCounts).reduce(
        (sum, count) => sum + count,
        0
      )
      const otherCount = totalCount - knownCategoriesTotal

      if (otherCount > 0) {
        categoryCounts['Other'] = otherCount
      }
    }
  } catch (fallbackError) {
    console.error('Fallback "Other" calculation failed:', fallbackError)
  }

  // Convert to array format and sort by count descending
  return Object.entries(categoryCounts)
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
      customAggregateFunction={aggregateRegularSocialMediaUseData}
    />
  )
}
