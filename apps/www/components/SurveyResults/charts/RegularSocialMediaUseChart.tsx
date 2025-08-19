import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateRegularSocialMediaUseSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH founders AS (
  SELECT id, regular_social_media_use
  FROM responses_b_2025${whereClause ? '\n' + whereClause : ''}
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
// FROM responses_b_2025${whereClause ? '\n' + whereClause : ''}
// GROUP BY social_media
// ORDER BY total DESC;

export function RegularSocialMediaUseChart() {
  return (
    <SurveyChart
      title="Which social media platforms do you use at least 3× per week?"
      targetColumn="regular_social_media_use"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateRegularSocialMediaUseSQL}
    />
  )
}
