import { SurveyChart } from '../SurveyChart'

function generateAcceleratorParticipationSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  whereClauses.push(`accelerator_participation_normalized IS NOT NULL`)

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
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
    <SurveyChart
      title="If your startup has participated in an accelerator, which one?"
      targetColumn="accelerator_participation_normalized"
      filterColumns={['person_age', 'headquarters', 'money_raised']}
      generateSQLQuery={generateAcceleratorParticipationSQL}
    />
  )
}
