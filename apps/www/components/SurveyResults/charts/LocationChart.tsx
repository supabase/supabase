import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateLocationSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT
  location,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY location
ORDER BY total DESC;`
}

// Custom aggregate function for location data
async function aggregateLocationData(activeFilters: Record<string, string>, supabaseClient: any) {
  // Get unique locations and their counts
  const { data: uniqueValues, error: uniqueError } = await supabaseClient
    .from('responses_2025')
    .select('location')

  if (uniqueError) {
    console.error('Error getting unique locations:', uniqueError)
    return []
  }

  // Extract unique locations and remove duplicates
  const uniqueLocations = [...new Set(uniqueValues.map((row: any) => row.location).filter(Boolean))]

  const locationCounts: Record<string, number> = {}

  // Get count for each location
  for (const location of uniqueLocations) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .eq('location', location)

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${location}:`, countError)
      continue
    }

    locationCounts[location as string] = count || 0
  }

  // Convert to array format and sort by count descending
  return Object.entries(locationCounts)
    .map(([location, total]) => ({ label: location, total }))
    .sort((a, b) => b.total - a.total)
}

export function LocationChart() {
  return (
    <SurveyChart
      title="Where is your startup headquartered?"
      targetColumn="location"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateLocationSQL}
      customAggregateFunction={aggregateLocationData}
    />
  )
}
