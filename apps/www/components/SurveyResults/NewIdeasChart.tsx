import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateNewIdeasSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`must_have_dev_tools IS NOT NULL`)
  whereClauses.push(`must_have_dev_tools != ''`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.role !== 'unset') {
    whereClauses.push(`role = '${activeFilters.role}'`)
  }

  if (activeFilters.industry_normalized !== 'unset') {
    whereClauses.push(`industry_normalized = '${activeFilters.industry_normalized}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  avenue,
  COUNT(DISTINCT id) AS respondents
FROM (
  SELECT id, unnest(new_ideas) AS avenue
  FROM responses_2025${whereClause ? '\n' + whereClause : ''}
) sub
GROUP BY avenue
ORDER BY respondents DESC;`
}

export function NewIdeasChart() {
  return (
    <GenericChartWithQuery
      title="Where do you usually discover new dev tools or startup ideas?"
      targetColumn="new_ideas"
      filterColumns={['person_age', 'role', 'industry_normalized']}
      generateSQLQuery={generateNewIdeasSQL}
    />
  )
}
