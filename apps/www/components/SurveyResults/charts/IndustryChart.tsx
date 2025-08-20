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

// Custom aggregation function for industry that only queries the categories we care about
async function getIndustryAggregates(activeFilters: Record<string, string>, supabaseClient: any) {
  // Define industry categories once
  const industryCategories = [
    'Developer tools and platforms',
    'AI / ML tools',
    'SaaS',
    'Consumer',
    'Education',
    'eCommerce',
    'Fintech',
    'Healthtech',
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific industry category
  for (const category of industryCategories) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .eq('industry', category)

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${category}:`, countError)
      continue
    }

    const categoryCount = count || 0

    // Map to consolidated categories
    if (category === 'Developer tools and platforms') {
      categoryCounts['Dev tools'] = (categoryCounts['Dev tools'] || 0) + categoryCount
    } else if (category === 'AI / ML tools') {
      categoryCounts['AI / ML'] = (categoryCounts['AI / ML'] || 0) + categoryCount
    } else {
      categoryCounts[category] = (categoryCounts[category] || 0) + categoryCount
    }
  }

  // Get count for "Other" (everything not in our specific categories)
  let otherQuery = supabaseClient
    .from('responses_2025')
    .select('*', { count: 'exact', head: true })
    .not('industry', 'in', industryCategories)

  // Apply additional filters
  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== 'unset') {
      otherQuery = otherQuery.eq(column, value)
    }
  }

  console.log("Industry categories we're counting:", industryCategories)
  console.log('Querying for "Other" (everything not in the above list)')

  const { count: otherCount, error: otherError } = await otherQuery

  if (otherError) {
    console.error('Error getting "Other" count:', otherError)
  } else {
    console.log('"Other" count result:', otherCount)
  }

  if (!otherError && otherCount) {
    categoryCounts['Other'] = otherCount
    console.log('Added "Other" to categoryCounts:', otherCount)
  } else {
    console.log('"Other" count was 0 or had error, not adding to categoryCounts')

    // Fallback: try to get total count and subtract known categories
    try {
      let totalQuery = supabaseClient
        .from('responses_2025')
        .select('*', { count: 'exact', head: true })

      // Apply additional filters
      for (const [column, value] of Object.entries(activeFilters)) {
        if (value && value !== 'unset') {
          totalQuery = totalQuery.eq(column, value)
        }
      }

      const { count: totalCount, error: totalError } = await totalQuery

      if (!totalError && totalCount) {
        const knownCategoriesTotal = Object.values(categoryCounts).reduce(
          (sum, count) => sum + count,
          0
        )
        const otherCount = totalCount - knownCategoriesTotal

        if (otherCount > 0) {
          categoryCounts['Other'] = otherCount
          console.log('Fallback: Calculated "Other" as total - known categories:', otherCount)
        }
      }
    } catch (fallbackError) {
      console.error('Fallback "Other" calculation failed:', fallbackError)
    }
  }

  console.log('Final categoryCounts before conversion:', categoryCounts)

  // Convert to array format and sort by count descending
  // Return in the format expected by the chart: [{ label: string, total: number }]
  return Object.entries(categoryCounts)
    .map(([industry, total]) => ({ label: industry, total }))
    .sort((a, b) => b.total - a.total)
}

export function IndustryChart() {
  return (
    <SurveyChart
      title="What is your startup's primary industry or target customer segment?"
      targetColumn="industry"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateIndustrySQL}
      customAggregateFunction={getIndustryAggregates} // Use custom aggregation logic
    />
  )
}
