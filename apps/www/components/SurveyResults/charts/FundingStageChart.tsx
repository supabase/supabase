import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateFundingStageSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT
    funding_stage,
    COUNT(*) AS total
  FROM responses_2025${whereClause ? '\n' + whereClause : ''}
  GROUP BY funding_stage
  ORDER BY CASE 
      WHEN funding_stage = 'Bootstrapped' THEN 1
      WHEN funding_stage = 'Pre-seed' THEN 2
      WHEN funding_stage = 'Seed' THEN 3
      WHEN funding_stage = 'Series A' THEN 4
      WHEN funding_stage = 'Series B' THEN 5
      WHEN funding_stage = 'Series C' THEN 6
      WHEN funding_stage = 'Series D or later' THEN 7
      ELSE 8
  END;`
}

export function FundingStageChart() {
  return (
    <SurveyChart
      title="What stage of funding is your startup in?"
      targetColumn="funding_stage"
      filterColumns={['person_age', 'location', 'team_size']}
      functionName="get_funding_stage_stats"
      generateSQLQuery={generateFundingStageSQL}
    />
  )
}
