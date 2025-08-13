import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateAcceleratorParticipationSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, [
    'accelerator_participation_normalized IS NOT NULL',
  ])

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
