import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateAIModelsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  unnest(ai_models_used) AS model,
  COUNT(*) AS total
FROM responses_b_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY model
ORDER BY total DESC;`
}

export function AIModelsChart() {
  return (
    <SurveyChart
      title="Which AI models are you using or planning to use?"
      targetColumn="ai_models_used"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateAIModelsSQL}
    />
  )
}
