import { SurveyChart, buildWhereClause, createCategoryAggregator } from '../SurveyChart'

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

// Custom aggregate function that respects funding stage ordering
function aggregateFundingStageData(activeFilters: Record<string, string>, supabaseClient: any) {
  // Define all the funding stages in the correct order
  const fundingStages = [
    'Bootstrapped',
    'Pre-seed',
    'Seed',
    'Series A',
    'Series B',
    'Series C',
    'Series D or later',
  ]

  // Use the helper function to create our custom aggregator
  const stageAggregator = createCategoryAggregator('funding_stage', fundingStages)

  return stageAggregator(activeFilters, supabaseClient).then((data) => {
    // Sort the data according to our predefined order
    const stageOrder = {
      Bootstrapped: 1,
      'Pre-seed': 2,
      Seed: 3,
      'Series A': 4,
      'Series B': 5,
      'Series C': 6,
      'Series D or later': 7,
    }

    return data.sort((a, b) => {
      const orderA = stageOrder[a.label as keyof typeof stageOrder] || 999
      const orderB = stageOrder[b.label as keyof typeof stageOrder] || 999
      return orderA - orderB
    })
  })
}

export function FundingStageChart() {
  return (
    <SurveyChart
      title="What stage of funding is your startup in?"
      targetColumn="funding_stage"
      filterColumns={['person_age', 'location', 'team_size']}
      generateSQLQuery={generateFundingStageSQL}
      customAggregateFunction={aggregateFundingStageData}
    />
  )
}
