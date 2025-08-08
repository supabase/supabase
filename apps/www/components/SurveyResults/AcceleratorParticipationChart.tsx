import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateAcceleratorParticipationSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`accelerator_participation_normalized IS NOT NULL`)

  if (activeFilters.previous_company !== 'unset') {
    whereClauses.push(`previous_company = '${activeFilters.previous_company}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
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
      filterColumns={['previous_company', 'headquarters', 'funding_stage']}
      generateSQLQuery={generateAcceleratorParticipationSQL}
    />
  )
}
