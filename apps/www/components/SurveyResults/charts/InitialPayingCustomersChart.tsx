import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateInitialPayingCustomersSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH customer_source_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN source IN (
          'Personal/professional network',
          'Inbound from social media (Twitter, LinkedIn, etc.)',
          'Cold outreach or sales',
          'Content (blog, newsletter, SEO)',
          'Developer communities (Discord, Slack, Reddit, etc.)',
          'Open source users who converted',
          'Accelerators/incubators',
          'Hacker News or Product Hunt'
        ) THEN source
        ELSE 'Other'
      END AS source_clean
    FROM (
      SELECT id, unnest(initial_paying_customers) AS source
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    source_clean AS source,
    COUNT(DISTINCT id) AS respondents
  FROM customer_source_mapping
  GROUP BY source_clean
  ORDER BY respondents DESC;`
}

// Custom aggregate function for initial paying customers data
async function aggregateInitialPayingCustomersData(
  activeFilters: Record<string, string>,
  supabaseClient: any
) {
  const specificSources = [
    'Personal/professional network',
    'Inbound from social media (Twitter, LinkedIn, etc.)',
    'Cold outreach or sales',
    'Content (blog, newsletter, SEO)',
    'Developer communities (Discord, Slack, Reddit, etc.)',
    'Open source users who converted',
    'Accelerators/incubators',
    'Hacker News or Product Hunt',
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific source
  for (const source of specificSources) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .contains('initial_paying_customers', [source])

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${source}:`, countError)
      continue
    }

    categoryCounts[source] = count || 0
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
    .map(([source, total]) => ({ label: source, total }))
    .sort((a, b) => b.total - a.total)
}

export function InitialPayingCustomersChart() {
  return (
    <SurveyChart
      title="How did you get your first paying customers?"
      targetColumn="initial_paying_customers"
      filterColumns={['person_age', 'location', 'team_size']}
      generateSQLQuery={generateInitialPayingCustomersSQL}
      customAggregateFunction={aggregateInitialPayingCustomersData}
    />
  )
}
