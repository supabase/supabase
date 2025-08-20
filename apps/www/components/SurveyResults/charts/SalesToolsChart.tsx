import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateSalesToolsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH customer_tool_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN tool IN (        
          'HubSpot',
          'Salesforce',
          'Pipedrive',
          'Close.com',
          'Notion / Airtable',
          'Google Sheets',
          'We don't have a formal CRM or sales tool yet'
        ) THEN tool
        ELSE 'Other'
      END AS tool_clean
    FROM (
      SELECT id, unnest(sales_tools) AS tool
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    tool_clean AS tool,
    COUNT(DISTINCT id) AS respondents
  FROM customer_tool_mapping
  GROUP BY tool_clean
  ORDER BY respondents DESC;`
}

// Custom aggregate function for sales tools data
async function aggregateSalesToolsData(activeFilters: Record<string, string>, supabaseClient: any) {
  const specificTools = [
    'HubSpot',
    'Salesforce',
    'Pipedrive',
    'Close.com',
    'Notion / Airtable',
    'Google Sheets',
    "We don't have a formal CRM or sales tool yet",
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific tool
  for (const tool of specificTools) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .contains('sales_tools', [tool])

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${tool}:`, countError)
      continue
    }

    categoryCounts[tool] = count || 0
  }

  // Get count for "Other" (everything not in our specific categories)
  // This is complex for array fields, so we'll calculate it as total - known categories
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
      }
    }
  } catch (fallbackError) {
    console.error('Fallback "Other" calculation failed:', fallbackError)
  }

  // Convert to array format and sort by count descending
  return Object.entries(categoryCounts)
    .map(([tool, total]) => ({ label: tool, total }))
    .sort((a, b) => b.total - a.total)
}

export function SalesToolsChart() {
  return (
    <SurveyChart
      title="What tools are you using to manage your sales process?"
      targetColumn="sales_tools"
      filterColumns={['person_age', 'location', 'team_size']}
      generateSQLQuery={generateSalesToolsSQL}
      customAggregateFunction={aggregateSalesToolsData}
    />
  )
}
