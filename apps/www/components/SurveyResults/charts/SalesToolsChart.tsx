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

function transformSalesToolsData(data: any[]) {
  // Raw data from Supabase: [{ id: 1, sales_tools: ['tool1', 'tool2'] }, ...]
  // Need to flatten array data and apply CASE logic
  const toolCounts: Record<string, number> = {}

  data.forEach((row) => {
    const tools = row.sales_tools || []
    tools.forEach((tool: string) => {
      let cleanTool = tool
      if (
        ![
          'HubSpot',
          'Salesforce',
          'Pipedrive',
          'Close.com',
          'Notion / Airtable',
          'Google Sheets',
          "We don't have a formal CRM or sales tool yet",
        ].includes(tool)
      ) {
        cleanTool = 'Other'
      }

      toolCounts[cleanTool] = (toolCounts[cleanTool] || 0) + 1
    })
  })

  // Convert to array format and sort by count descending
  return Object.entries(toolCounts)
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
      transformData={transformSalesToolsData}
    />
  )
}
