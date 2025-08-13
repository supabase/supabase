import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateFundingStageSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

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
    <SurveyChart
      title="What stage of funding is your startup in?"
      targetColumn="funding_stage"
      filterColumns={['person_age', 'headquarters', 'team_count']}
      generateSQLQuery={generateFundingStageSQL}
    />
  )
}
