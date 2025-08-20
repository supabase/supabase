import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Helper function to convert filters to the format expected by the database function
function buildFunctionParams(activeFilters: Record<string, string>) {
  const params: Record<string, any> = {}

  // Convert single values to arrays for the function parameters
  if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
    params.person_age_filter = [activeFilters.person_age]
  }
  if (activeFilters.location && activeFilters.location !== 'unset') {
    params.location_filter = [activeFilters.location]
  }
  if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
    params.money_raised_filter = [activeFilters.money_raised]
  }

  return params
}

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
      functionParams={buildFunctionParams}
      generateSQLQuery={generateFundingStageSQL}
    />
  )
}
