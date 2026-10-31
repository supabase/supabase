import { SurveyChart, buildWhereClause } from '../SurveyChart'

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
      generateSQLQuery={generateIndustrySQL}
    />
  )
}
