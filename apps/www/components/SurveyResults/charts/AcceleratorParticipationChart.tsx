import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateAcceleratorParticipationSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, ['accelerator_participation IS NOT NULL'])

  return `WITH accelerator_mapping AS (
  SELECT 
    accelerator_participation,
    CASE 
      WHEN accelerator_participation IN ('YC', 'Techstars', 'EF', '500 Global', 'Plug and Play', 'Antler') THEN accelerator_participation
      WHEN accelerator_participation = 'Did not participate in an accelerator' THEN NULL
      ELSE 'Other'
    END AS accelerator_clean
  FROM responses_2025
  ${whereClause ? '\n  ' + whereClause : ''}
)
SELECT 
  accelerator_clean AS accelerator_participation,
  COUNT(*) AS total
FROM accelerator_mapping
WHERE accelerator_clean IS NOT NULL
GROUP BY accelerator_clean
ORDER BY total DESC;`
}

export function AcceleratorParticipationChart() {
  return (
    <SurveyChart
      title="If your startup has participated in an accelerator, which one?"
      targetColumn="accelerator_participation"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_accelerator_stats"
      generateSQLQuery={generateAcceleratorParticipationSQL}
    />
  )
}
