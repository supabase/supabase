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

// Custom aggregate function that excludes non-participants
async function aggregateAcceleratorData(
  activeFilters: Record<string, string>,
  supabaseClient: any
) {
  const specificAccelerators = ['YC', 'Techstars', 'EF', '500 Global', 'Plug and Play', 'Antler']

  const categoryCounts: Record<string, number> = {}

  // Get counts for each specific accelerator
  for (const accelerator of specificAccelerators) {
    let countQuery = supabaseClient
      .from('responses_2025')
      .select('*', { count: 'exact', head: true })
      .eq('accelerator_participation', accelerator)

    // Apply additional filters
    for (const [column, value] of Object.entries(activeFilters)) {
      if (value && value !== 'unset') {
        countQuery = countQuery.eq(column, value)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error getting count for ${accelerator}:`, countError)
      continue
    }

    categoryCounts[accelerator] = count || 0
  }

  // Get count for "Other" (everything not in our specific categories, excluding non-participants)
  let otherQuery = supabaseClient
    .from('responses_2025')
    .select('*', { count: 'exact', head: true })
    .not('accelerator_participation', 'in', [
      ...specificAccelerators,
      'Did not participate in an accelerator',
    ])

  // Apply additional filters
  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== 'unset') {
      otherQuery = otherQuery.eq(column, value)
    }
  }

  console.log('Other query filters:', {
    excludedValues: [...specificAccelerators, 'Did not participate in an accelerator'],
    activeFilters,
  })

  const { count: otherCount, error: otherError } = await otherQuery

  if (otherError) {
    console.error('Error getting Other count:', otherError)
  } else {
    console.log('Other count result:', otherCount)
  }

  if (!otherError && otherCount) {
    categoryCounts['Other'] = otherCount
  }

  // Debug logging
  console.log('Accelerator aggregate results:', categoryCounts)

  // Convert to array format and sort by count descending
  const result = Object.entries(categoryCounts)
    .map(([accelerator, total]) => ({ label: accelerator, total }))
    .sort((a, b) => b.total - a.total)

  console.log('Final accelerator data:', result)
  return result
}

export function AcceleratorParticipationChart() {
  return (
    <SurveyChart
      title="If your startup has participated in an accelerator, which one?"
      targetColumn="accelerator_participation"
      filterColumns={['person_age', 'location', 'money_raised']}
      generateSQLQuery={generateAcceleratorParticipationSQL}
      customAggregateFunction={aggregateAcceleratorData}
    />
  )
}
