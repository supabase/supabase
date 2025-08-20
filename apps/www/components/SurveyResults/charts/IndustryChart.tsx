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

function generateIndustrySQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, ['industry IS NOT NULL'])

  return `WITH industry_mapping AS (
  SELECT 
    industry,
    CASE 
      WHEN industry = 'Developer tools and platforms' THEN 'Dev tools'
      WHEN industry = 'AI / ML tools' THEN 'AI / ML'
      WHEN industry IN ('SaaS', 'Dev tools', 'AI / ML', 'Consumer', 'Education', 'eCommerce', 'Fintech', 'Healthtech') THEN industry
      ELSE 'Other'
    END AS industry_clean
  FROM responses_2025
  ${whereClause}
)
SELECT 
  industry_clean AS industry,
  COUNT(*) AS total
FROM industry_mapping
GROUP BY industry_clean
ORDER BY total DESC;`
}

export function IndustryChart() {
  return (
    <SurveyChart
      title="What is your startup’s primary industry or target customer segment?"
      targetColumn="industry"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_industry_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateIndustrySQL}
    />
  )
}
