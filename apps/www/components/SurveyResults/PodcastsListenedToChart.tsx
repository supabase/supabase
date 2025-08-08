import { GenericChartWithQuery } from './GenericChartWithQuery'

function generatePodcastsListenedToSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.industry_normalized !== 'unset') {
    whereClauses.push(`industry_normalized = '${activeFilters.industry_normalized}'`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT technology, COUNT(*) AS total
FROM (
  SELECT 
    CASE 
      WHEN podcasts_listened_to = '{}' THEN 'None'
      WHEN podcast = 'I don''t listen to podcasts regularly' THEN 'None'
      ELSE podcast
    END AS technology
  FROM responses_2025
  CROSS JOIN LATERAL unnest(
    CASE WHEN podcasts_listened_to = '{}' THEN ARRAY['None'] ELSE podcasts_listened_to END
  ) AS podcast${whereClause ? '\n' + whereClause : ''}
) t
GROUP BY technology
ORDER BY total DESC;`
}

export function PodcastsListenedToChart() {
  return (
    <GenericChartWithQuery
      title="Which of these podcasts do you listen to regularly?"
      targetColumn="podcasts_listened_to"
      filterColumns={['headquarters', 'industry_normalized', 'currently_monetizing']}
      generateSQLQuery={generatePodcastsListenedToSQL}
    />
  )
}
