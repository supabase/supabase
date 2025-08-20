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

function transformNewIdeasData(data: any[]) {
  // Raw data from Supabase: [{ id: 1, new_ideas: ['avenue1', 'avenue2'] }, ...]
  // Need to flatten array data and apply CASE logic
  const avenueCounts: Record<string, number> = {}

  data.forEach((row) => {
    const avenues = row.new_ideas || []
    avenues.forEach((avenue: string) => {
      let cleanAvenue = avenue
      if (
        ![
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
        ].includes(avenue)
      ) {
        cleanAvenue = 'Other'
      }

      avenueCounts[cleanAvenue] = (avenueCounts[cleanAvenue] || 0) + 1
    })
  })

  // Convert to array format and sort by count descending
  return Object.entries(avenueCounts)
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
      transformData={transformNewIdeasData}
    />
  )
}
