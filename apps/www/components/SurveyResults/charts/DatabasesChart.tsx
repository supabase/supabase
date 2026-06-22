import { SurveyChart, buildWhereClause } from '../SurveyChart'

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
      generateSQLQuery={generateDatabasesSQL}
    />
  )
}
