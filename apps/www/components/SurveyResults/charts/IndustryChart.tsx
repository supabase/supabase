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

function transformIndustryData(data: any[]) {
  // Raw data from Supabase: [{ industry: 'Developer tools and platforms' }, { industry: 'SaaS' }, ...]
  // Need to apply CASE logic and aggregate by counting occurrences
  const industryCounts: Record<string, number> = {}

  data.forEach((row) => {
    const industry = row.industry
    if (industry) {
      let cleanIndustry = industry

      if (industry === 'Developer tools and platforms') {
        cleanIndustry = 'Dev tools'
      } else if (industry === 'AI / ML tools') {
        cleanIndustry = 'AI / ML'
      } else if (
        ![
          'SaaS',
          'Dev tools',
          'AI / ML',
          'Consumer',
          'Education',
          'eCommerce',
          'Fintech',
          'Healthtech',
        ].includes(industry)
      ) {
        cleanIndustry = 'Other'
      }

      industryCounts[cleanIndustry] = (industryCounts[cleanIndustry] || 0) + 1
    }
  })

  // Convert to array format and sort by count descending
  return Object.entries(industryCounts)
    .map(([industry, total]) => ({ label: industry, total }))
    .sort((a, b) => b.total - a.total)
}

export function IndustryChart() {
  return (
    <SurveyChart
      title="What is your startup’s primary industry or target customer segment?"
      targetColumn="industry"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateIndustrySQL}
      transformData={transformIndustryData}
    />
  )
}
