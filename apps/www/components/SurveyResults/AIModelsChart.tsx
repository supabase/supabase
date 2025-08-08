import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateDatabasesSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  if (activeFilters.startup_age !== 'unset') {
    whereClauses.push(`startup_age = '${activeFilters.startup_age}'`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  unnest(ai_models_used) AS model,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY model
ORDER BY total DESC;`
}

export function AIModelsChart() {
  return (
    <GenericChartWithQuery
      title="Which AI models are you using or planning to use?"
      targetColumn="ai_models_used"
      filterColumns={['funding_stage', 'startup_age', 'currently_monetizing']}
      generateSQLQuery={generateDatabasesSQL}
    />
  )
}
