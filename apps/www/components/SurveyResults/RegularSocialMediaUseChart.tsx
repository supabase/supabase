import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateRegularSocialMediaUseSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.role !== 'unset') {
    whereClauses.push(`role = '${activeFilters.role}'`)
  }

  if (activeFilters.industry_normalized !== 'unset') {
    whereClauses.push(`industry_normalized = '${activeFilters.industry_normalized}'`)
  }

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `WITH founders AS (
  SELECT id, regular_social_media_use
  FROM responses_2025
  WHERE role = 'Founder / Co-founder'
)
SELECT
  platform AS label,
  COUNT(*) AS total
FROM (
  SELECT id, unnest(regular_social_media_use) AS platform
  FROM founders
) t
GROUP BY platform
ORDER BY total DESC;
`
}

// SELECT
//   unnest(regular_social_media_use) AS social_media,
//   COUNT(*) AS total
// FROM responses_2025${whereClause ? '\n' + whereClause : ''}
// GROUP BY social_media
// ORDER BY total DESC;

export function RegularSocialMediaUseChart() {
  return (
    <GenericChartWithQuery
      title="Which social media platforms do you use at least 3× per week?"
      targetColumn="regular_social_media_use"
      filterColumns={['role', 'industry_normalized', 'person_age']}
      generateSQLQuery={generateRegularSocialMediaUseSQL}
      // isPercentageData={false}
    />
  )
}
