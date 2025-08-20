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

// Custom aggregate function for databases data
async function aggregateDatabasesData(activeFilters: Record<string, string>, supabaseClient: any) {
  const specificTechnologies = [
    'Supabase',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'Firebase',
    'SQLite',
  ]

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific technology
  for (const technology of specificTechnologies) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .contains('databases', [technology])

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${technology}:`, countError)
      continue
    }

    categoryCounts[technology] = count || 0
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
      customAggregateFunction={aggregateDatabasesData}
    />
  )
}
