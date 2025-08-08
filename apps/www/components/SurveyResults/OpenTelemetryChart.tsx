import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateOpenTelemetrySQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  use_opentelemetry,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY use_opentelemetry
ORDER BY 
  CASE use_opentelemetry
    WHEN 'Yes' THEN 1
    WHEN 'Not yet, but planning to' THEN 2
    WHEN 'No' THEN 3
END;`
}

export function OpenTelemetryChart() {
  return (
    <GenericChartWithQuery
      title="Do you use OpenTelemetry in your observability stack?"
      targetColumn="use_opentelemetry"
      filterColumns={['currently_monetizing', 'money_raised']}
      generateSQLQuery={generateOpenTelemetrySQL}
      chartType="pie"
    />
  )
}
