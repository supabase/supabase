import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateFrontendStackSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  unnest(frontend_stack) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function FrontendStackChart() {
  return (
    <SurveyChart
      title="What frontend technologies are your startup using?"
      targetColumn="frontend_stack"
      filterColumns={['headquarters', 'industry_normalized', 'person_age']}
      generateSQLQuery={generateFrontendStackSQL}
    />
  )
}
