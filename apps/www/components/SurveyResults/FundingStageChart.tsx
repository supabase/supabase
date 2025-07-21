import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateFundingStageSQL(activeFilters) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  funding_stage,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY funding_stage
ORDER BY 
  CASE funding_stage
    WHEN 'Bootstrapped' THEN 1
    WHEN 'Pre-seed' THEN 2
    WHEN 'Seed' THEN 3
    WHEN 'Series A' THEN 4
    WHEN 'Series B' THEN 5
    WHEN 'Series C' THEN 5
    WHEN 'Series D+' THEN 6
  END;`
}

export function FundingStageChart() {
  return (
    <GenericChartWithQuery
      title="What stage of funding is your startup in?"
      targetColumn="funding_stage"
      filterColumns={['headquarters', 'money_raised', 'currently_monetizing']}
      generateSQLQuery={generateFundingStageSQL}
    />
  )
}
