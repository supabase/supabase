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

function transformInitialPayingCustomersData(data: any[]) {
  // Raw data from Supabase: [{ id: 1, initial_paying_customers: ['source1', 'source2'] }, ...]
  // Need to flatten array data and apply CASE logic
  const sourceCounts: Record<string, number> = {}

  data.forEach((row) => {
    const sources = row.initial_paying_customers || []
    sources.forEach((source: string) => {
      let cleanSource = source
      if (
        ![
          'Personal/professional network',
          'Inbound from social media (Twitter, LinkedIn, etc.)',
          'Cold outreach or sales',
          'Content (blog, newsletter, SEO)',
          'Developer communities (Discord, Slack, Reddit, etc.)',
          'Open source users who converted',
          'Accelerators/incubators',
          'Hacker News or Product Hunt',
        ].includes(source)
      ) {
        cleanSource = 'Other'
      }

      sourceCounts[cleanSource] = (sourceCounts[cleanSource] || 0) + 1
    })
  })

  // Convert to array format and sort by count descending
  return Object.entries(sourceCounts)
    .map(([source, total]) => ({ label: source, total }))
    .sort((a, b) => b.total - a.total)
}

export function InitialPayingCustomersChart() {
  return (
    <SurveyChart
      targetColumn="initial_paying_customers"
      filterColumns={['person_age', 'location', 'team_size']}
      generateSQLQuery={generateInitialPayingCustomersSQL}
      transformData={transformInitialPayingCustomersData}
    />
  )
}
