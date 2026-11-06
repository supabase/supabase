/**
 * Builds the real, pasteable aggregation SQL shown in each chart's "SQL" view.
 * This mirrors what the generic RPCs actually run against responses_<year>, so
 * a reader can copy it and run it themselves: multi-select unnests the array
 * and counts distinct respondents over the respondent-count denominator;
 * single/boolean use a window for the share.
 */

import type { Aggregation, SurveyFilters } from './survey-key'

function quote(v: string): string {
  return `'${v.replace(/'/g, "''")}'`
}

function filterClauses(filters?: SurveyFilters): string[] {
  if (!filters) return []
  return Object.entries(filters).map(([col, val]) =>
    Array.isArray(val)
      ? `${col} = any(array[${val.map(quote).join(', ')}])`
      : `${col} = ${quote(val as string)}`
  )
}

export function buildSurveySql(
  year: number,
  column: string,
  aggregation: Aggregation,
  filters?: SurveyFilters,
  maxBars?: number
): string {
  const table = `responses_${year}`
  const extra = filterClauses(filters)
  const limit = maxBars ? `\nlimit ${maxBars}` : ''

  if (aggregation === 'multi') {
    const where = [`r.${column} is not null`, ...extra].join('\n    and ')
    return `-- % of respondents who selected each option
with answered as (
  select count(*)::numeric as total
  from ${table} r
  where ${where}
)
select
  tag                                                  as label,
  count(distinct r.id)                                 as count,
  round(100 * count(distinct r.id) /
    (select total from answered), 1)                   as pct
from ${table} r, unnest(r.${column}) as tag
where ${where}
group by tag
order by count desc${limit};`
  }

  if (aggregation === 'boolean') {
    const where = [`${column} is not null`, ...extra].join('\n    and ')
    return `select
  case when ${column} then 'Yes' else 'No' end         as label,
  count(*)                                             as count,
  round(100 * count(*) / sum(count(*)) over (), 1)     as pct
from ${table}
where ${where}
group by ${column}
order by label;`
  }

  const where = [`${column} is not null`, ...extra].join('\n    and ')
  return `select
  ${column}                                            as label,
  count(*)                                             as count,
  round(100 * count(*) / sum(count(*)) over (), 1)     as pct
from ${table}
where ${where}
group by ${column}
order by count desc${limit};`
}
