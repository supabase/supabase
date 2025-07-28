import { GenericChartWithQuery } from './GenericChartWithQuery'

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

  return `SELECT * FROM (
    SELECT
      CASE 
        WHEN funding_stage IN ('Series A', 'Series B', 'Series C', 'Series D or later') THEN 'Series A+'
        ELSE funding_stage
      END AS funding_stage,
      COUNT(*) AS total
    FROM responses_2025${whereClause ? '\n' + whereClause : ''}
    GROUP BY CASE 
        WHEN funding_stage IN ('Series A', 'Series B', 'Series C', 'Series D or later') THEN 'Series A+'
        ELSE funding_stage
      END
  ) subquery
  ORDER BY CASE 
      WHEN funding_stage = 'Bootstrapped' THEN 1
      WHEN funding_stage = 'Pre-seed' THEN 2
      WHEN funding_stage = 'Seed' THEN 3
      WHEN funding_stage = 'Series A+' THEN 4
      ELSE 5
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
