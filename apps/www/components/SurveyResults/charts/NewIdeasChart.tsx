import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateNewIdeasSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, [
    'must_have_dev_tools IS NOT NULL',
    "must_have_dev_tools != ''",
  ])

  return `SELECT 
  avenue,
  COUNT(DISTINCT id) AS respondents
FROM (
  SELECT id, unnest(new_ideas) AS avenue
  FROM responses_b_2025${whereClause ? '\n' + whereClause : ''}
) sub
GROUP BY avenue
ORDER BY respondents DESC;`
}

export function NewIdeasChart() {
  return (
    <SurveyChart
      title="Where do you usually discover new dev tools or startup ideas?"
      targetColumn="new_ideas"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateNewIdeasSQL}
    />
  )
}
