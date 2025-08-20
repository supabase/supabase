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

function transformDatabasesData(data: any[]) {
  // Raw data from Supabase: [{ id: 1, databases: ['tech1', 'tech2'] }, ...]
  // Need to flatten array data and apply CASE logic
  const technologyCounts: Record<string, number> = {}

  data.forEach((row) => {
    const technologies = row.databases || []
    technologies.forEach((technology: string) => {
      let cleanTechnology = technology
      if (
        !['Supabase', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'SQLite'].includes(
          technology
        )
      ) {
        cleanTechnology = 'Other'
      }

      technologyCounts[cleanTechnology] = (technologyCounts[cleanTechnology] || 0) + 1
    })
  })

  // Convert to array format and sort by count descending
  return Object.entries(technologyCounts)
    .map(([technology, total]) => ({ label: technology, total }))
    .sort((a, b) => b.total - a.total)
}

export function DatabasesChart() {
  return (
    <SurveyChart
      title="Which database(s) is your startup using?"
      targetColumn="databases"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateDatabasesSQL}
      transformData={transformDatabasesData}
    />
  )
}
