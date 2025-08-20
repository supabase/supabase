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

function transformLocationData(data: any[]) {
  // Raw data from Supabase: [{ location: 'North America' }, { location: 'Europe' }, ...]
  // Need to aggregate by counting occurrences
  const counts: Record<string, number> = {}

  data.forEach((row) => {
    const location = row.location
    if (location) {
      counts[location] = (counts[location] || 0) + 1
    }
  })

  // Convert to chart format and sort by count
  return Object.entries(counts)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total)
}

export function LocationChart() {
  return (
    <SurveyChart
      title="Where is your startup headquartered?"
      targetColumn="location"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      generateSQLQuery={generateLocationSQL}
      transformData={transformLocationData}
    />
  )
}
