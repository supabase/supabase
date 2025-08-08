import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generateIndustrySQL(activeFilters) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`industry_normalized IS NOT NULL`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }
  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  if (activeFilters.market_model !== 'unset') {
    whereClauses.push(`'${activeFilters.market_model}' = ANY(market_model)`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

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
    <GenericChartWithQuery
      title="What is your startup's primary industry or target customer segment?"
      targetColumn="industry_normalized"
      filterColumns={['person_age', 'funding_stage', 'market_model']}
      generateSQLQuery={generateIndustrySQL}
    />
  )
}
