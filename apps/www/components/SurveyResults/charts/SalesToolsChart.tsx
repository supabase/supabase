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
          'We don’t have a formal CRM or sales tool yet'
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

export function SalesToolsChart() {
  return (
    <SurveyChart
      title="What tools are you using to manage your sales process?"
      targetColumn="sales_tools"
      filterColumns={['person_age', 'location', 'team_size']}
      functionName="get_sales_tools_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateSalesToolsSQL}
    />
  )
}
