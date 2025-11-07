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

export function NewIdeasChart() {
  return (
    <SurveyChart
      title="Where do you usually discover new dev tools or startup ideas?"
      targetColumn="new_ideas"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_new_ideas_stats"
      generateSQLQuery={generateNewIdeasSQL}
    />
  )
}
