import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Generate SQL query for team count chart
function generateIndustrySQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, ['industry_normalized IS NOT NULL'])

  return `WITH industry_mapping AS (
  SELECT 
    industry_normalized,
    CASE 
      WHEN industry_normalized = 'Developer tools and platforms' THEN 'Dev tools'
      WHEN industry_normalized = 'AI / ML tools' THEN 'AI / ML'
      WHEN industry_normalized IN ('SaaS', 'Dev tools', 'AI / ML', 'Consumer', 'Education', 'eCommerce', 'Fintech', 'Healthtech') THEN industry_normalized
      ELSE 'Other'
    END AS industry_clean
  FROM responses_2025
  ${whereClause}
)
SELECT 
  industry_clean AS industry_normalized,
  COUNT(*) AS total
FROM industry_mapping
GROUP BY industry_clean
ORDER BY total DESC;`
}

export function IndustryChart() {
  return (
    <SurveyChart
      title="What is your startup's primary industry or target customer segment?"
      targetColumn="industry_normalized"
      filterColumns={['person_age', 'headquarters', 'money_raised']}
      generateSQLQuery={generateIndustrySQL}
    />
  )
}
