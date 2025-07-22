import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateAcceleratorParticipationSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`accelerator_participation_normalized IS NOT NULL`)

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.role !== 'unset') {
    whereClauses.push(`role = '${activeFilters.role}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = `WHERE ${whereClauses.join('\n  AND ')}`

  return `SELECT
  accelerator_participation_normalized,
  COUNT(*) AS total
FROM responses_2025
${whereClause}
GROUP BY accelerator_participation_normalized
ORDER BY total DESC;`
}

export function AcceleratorParticipationChart() {
  return (
    <GenericChartWithQuery
      title="If your startup has participated in an accelerator, which one?"
      targetColumn="accelerator_participation_normalized"
      filterColumns={['headquarters', 'role', 'money_raised']}
      generateSQLQuery={generateAcceleratorParticipationSQL}
    />
  )
}
