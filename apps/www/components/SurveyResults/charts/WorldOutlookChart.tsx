import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateWorldOutlookSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  world_outlook, 
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY world_outlook
ORDER BY total DESC;`
}

// Custom aggregate function for world outlook data
async function aggregateWorldOutlookData(
  activeFilters: Record<string, string>,
  supabaseClient: any
) {
  // Get unique outlook values and their counts
  const { data: uniqueValues, error: uniqueError } = await supabaseClient
    .from('responses_2025')
    .select('world_outlook')

  if (uniqueError) {
    console.error('Error getting unique world outlook values:', uniqueError)
    return []
  }

  // Extract unique outlook values and remove duplicates
  const uniqueOutlooks = [
    ...new Set(uniqueValues.map((row: any) => row.world_outlook).filter(Boolean)),
  ]

  const outlookCounts: Record<string, number> = {}

  // Get count for each outlook
  for (const outlook of uniqueOutlooks) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .eq('world_outlook', outlook)

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${outlook}:`, countError)
      continue
    }

    outlookCounts[outlook as string] = count || 0
  }

  // Convert to array format and sort by count descending
  return Object.entries(outlookCounts)
    .map(([outlook, total]) => ({ label: outlook, total }))
    .sort((a, b) => b.total - a.total)
}

export function WorldOutlookChart() {
  return (
    <SurveyChart
      title="Given the state of the world, are you…"
      targetColumn="world_outlook"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateWorldOutlookSQL}
      customAggregateFunction={aggregateWorldOutlookData}
    />
  )
}
