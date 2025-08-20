import { SurveyChart, buildWhereClause } from '../SurveyChart'

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

// Custom aggregate function for new ideas data
async function aggregateNewIdeasData(activeFilters: Record<string, string>, supabaseClient: any) {
  const specificAvenues = [
    'Hacker News',
    'GitHub',
    'Product Hunt',
    'Twitter/X',
    'Reddit',
    'YouTube',
    'Podcasts',
    'Blogs / Newsletters',
    'Discord / Slack communities',
    'Conferences / Meetups',
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific avenue
  for (const avenue of specificAvenues) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .contains('new_ideas', [avenue])

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${avenue}:`, countError)
      continue
    }

    categoryCounts[avenue] = count || 0
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
    .map(([avenue, total]) => ({ label: avenue, total }))
    .sort((a, b) => b.total - a.total)
}

export function NewIdeasChart() {
  return (
    <SurveyChart
      title="Where do you usually discover new dev tools or startup ideas?"
      targetColumn="new_ideas"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateNewIdeasSQL}
      customAggregateFunction={aggregateNewIdeasData}
    />
  )
}
