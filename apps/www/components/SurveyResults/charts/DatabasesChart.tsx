import { SurveyChart, buildWhereClause } from '../SurveyChart'

// Helper function to convert filters to the format expected by the database function
function buildFunctionParams(activeFilters: Record<string, string>) {
  const params: Record<string, any> = {}

  // Convert single values to arrays for the function parameters
  if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
    params.person_age_filter = [activeFilters.person_age]
  }
  if (activeFilters.team_size && activeFilters.team_size !== 'unset') {
    params.team_size_filter = [activeFilters.team_size]
  }
  if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
    params.money_raised_filter = [activeFilters.money_raised]
  }

  return params
}

function generateDatabasesSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH database_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN technology IN (
          'Supabase',
          'PostgreSQL',
          'MySQL',
          'MongoDB',
          'Redis',
          'Firebase',
          'SQLite'
        ) THEN technology
        ELSE 'Other'
      END AS technology_clean
    FROM (
      SELECT id, unnest(databases) AS technology
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    technology_clean AS technology,
    COUNT(DISTINCT id) AS total
  FROM database_mapping
  GROUP BY technology_clean
  ORDER BY total DESC;`
}

export function DatabasesChart() {
  return (
    <SurveyChart
      title="Which database(s) is your startup using?"
      targetColumn="databases"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_databases_stats"
      functionParams={buildFunctionParams}
      generateSQLQuery={generateDatabasesSQL}
    />
  )
}
