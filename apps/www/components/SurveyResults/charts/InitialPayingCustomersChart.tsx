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

export function InitialPayingCustomersChart() {
  return (
    <SurveyChart
      title="Where did your startup’s initial paying customers come from?"
      targetColumn="initial_paying_customers"
      filterColumns={['person_age', 'location', 'team_size']}
      functionName="get_initial_paying_customers_stats"
      generateSQLQuery={generateInitialPayingCustomersSQL}
    />
  )
}
