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

function transformWorldOutlookData(data: any[]) {
  // Raw data from Supabase: [{ world_outlook: 'Optimistic' }, { world_outlook: 'Neutral' }, ...]
  // Need to aggregate by counting occurrences
  const counts: Record<string, number> = {}

  data.forEach((row) => {
    const outlook = row.world_outlook
    if (outlook) {
      counts[outlook] = (counts[outlook] || 0) + 1
    }
  })

  // Convert to chart format and sort by count
  return Object.entries(counts)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total)
}

export function WorldOutlookChart() {
  return (
    <SurveyChart
      title="Given the state of the world, are you…"
      targetColumn="world_outlook"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateWorldOutlookSQL}
      transformData={transformWorldOutlookData}
    />
  )
}
