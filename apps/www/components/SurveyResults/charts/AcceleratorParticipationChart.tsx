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
  ${whereClause}
)
SELECT 
  accelerator_clean AS accelerator_participation,
  COUNT(*) AS total
FROM accelerator_mapping
WHERE accelerator_clean IS NOT NULL
GROUP BY accelerator_clean
ORDER BY total DESC;`
}

function transformAcceleratorParticipationData(data: any[]) {
  // Raw data from Supabase: [{ accelerator_participation: 'YC' }, { accelerator_participation: 'Techstars' }, ...]
  // Need to apply CASE logic and aggregate by counting occurrences
  const acceleratorCounts: Record<string, number> = {}

  data.forEach((row) => {
    const accelerator = row.accelerator_participation

    if (accelerator === 'Did not participate in an accelerator') {
      return // Skip this case
    }

    let cleanAccelerator = accelerator
    if (!['YC', 'Techstars', 'EF', '500 Global', 'Plug and Play', 'Antler'].includes(accelerator)) {
      cleanAccelerator = 'Other'
    }

    acceleratorCounts[cleanAccelerator] = (acceleratorCounts[cleanAccelerator] || 0) + 1
  })

  // Convert to array format and sort by count descending
  return Object.entries(acceleratorCounts)
    .map(([accelerator_participation, total]) => ({ label: accelerator_participation, total }))
    .sort((a, b) => b.total - a.total)
}

export function AcceleratorParticipationChart() {
  return (
    <SurveyChart
      title="If your startup has participated in an accelerator, which one?"
      targetColumn="accelerator_participation"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateAcceleratorParticipationSQL}
      transformData={transformAcceleratorParticipationData}
    />
  )
}
