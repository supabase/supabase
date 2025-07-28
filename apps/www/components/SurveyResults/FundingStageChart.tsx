import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateFundingStageSQL(activeFilters) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  if (activeFilters.previous_company !== 'unset') {
    whereClauses.push(`previous_company = '${activeFilters.previous_company}'`)
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
      filterColumns={['headquarters', 'team_count', 'previous_company']}
      generateSQLQuery={generateFundingStageSQL}
    />
  )
}
