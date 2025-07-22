import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generatePivotFreqSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // if (activeFilters.headquarters !== 'unset') {
  //   whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  // }

  // if (activeFilters.currently_monetizing !== 'unset') {
  //   whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  // }

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.previous_company !== 'unset') {
    // Convert string to boolean for the SQL query
    const previousCompanyBool = activeFilters.previous_company === 'true'
    whereClauses.push(`previous_company = ${previousCompanyBool}`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  pivots_before_current,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY pivots_before_current
ORDER BY 
  CASE pivots_before_current
    WHEN 'Never' THEN 1
    WHEN 'Once' THEN 2
    WHEN 'Twice' THEN 3
    WHEN 'More than twice' THEN 4
  END;`
}

export function PivotFreqChart() {
  return (
    <GenericChartWithQuery
      title="How many times did your startup have to pivot before arriving at the current idea?"
      targetColumn="pivots_before_current"
      // filterColumns={['headquarters', 'currently_monetizing', 'person_age', 'previous_company']}
      filterColumns={['person_age', 'previous_company']}
      generateSQLQuery={generatePivotFreqSQL}
    />
  )
}
