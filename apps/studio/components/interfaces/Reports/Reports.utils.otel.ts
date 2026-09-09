import type { ReportFilterItem } from './Reports.types'
import {
  analyticsLiteral,
  joinSqlFragments,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'

const statusCode = safeSql`toInt32OrZero(log_attributes['response.status_code'])`
const originTime = safeSql`toFloat64OrNull(log_attributes['response.origin_time'])`
const hour = safeSql`toStartOfHour(logs.timestamp)`

export function generateReportFiltersOtel(filters: ReportFilterItem[], source = 'edge_logs') {
  const conditions = filters.map(({ key, value, compare }) => {
    let attribute = key.replace(/^metadata\./, '')
    if (attribute.startsWith('headers.')) attribute = `request.${attribute}`
    if (attribute.startsWith('cf.')) attribute = `request.${attribute}`
    if (source === 'function_edge_logs' && attribute === 'request.path') {
      attribute = 'request.pathname'
    }
    const field = safeSql`log_attributes[${analyticsLiteral(attribute)}]`
    if (compare === 'matches') return safeSql`match(${field}, ${analyticsLiteral(String(value))})`
    const isNumeric = attribute === 'response.status_code' || typeof value === 'number'
    const column = isNumeric ? safeSql`toFloat64OrZero(${field})` : field
    const literal = isNumeric ? analyticsLiteral(Number(value)) : analyticsLiteral(String(value))
    switch (compare) {
      case '!=':
        return safeSql`${column} != ${literal}`
      case '>=':
        return safeSql`${column} >= ${literal}`
      case '<=':
        return safeSql`${column} <= ${literal}`
      case '>':
        return safeSql`${column} > ${literal}`
      case '<':
        return safeSql`${column} < ${literal}`
      default:
        return safeSql`${column} = ${literal}`
    }
  })
  return conditions.length ? safeSql`and ${joinSqlFragments(conditions, ' and ')}` : safeSql``
}

function timeline(
  filters: ReportFilterItem[],
  source: string,
  metric: SafeLogSqlFragment,
  errors = false
) {
  return safeSql`
    select formatDateTime(${hour}, '%Y-%m-%dT%H:%i:%SZ', 'UTC') as timestamp, ${metric}
    from logs
    where source = ${analyticsLiteral(source)}
      ${errors ? safeSql`and ${statusCode} >= 400` : safeSql``}
      ${generateReportFiltersOtel(filters, source)}
    group by ${hour}
    order by timestamp asc
    limit 10000
  `
}

function routes(filters: ReportFilterItem[], source: string, mode: 'count' | 'errors' | 'slow') {
  const path = source === 'function_edge_logs' ? 'request.pathname' : 'request.path'
  return safeSql`
    select
      log_attributes[${analyticsLiteral(path)}] as path,
      log_attributes['request.method'] as method,
      log_attributes['request.search'] as search,
      ${statusCode} as status_code,
      toFloat64(count()) as count
      ${mode === 'slow' ? safeSql`, avg(${originTime}) as avg` : safeSql``}
    from logs
    where source = ${analyticsLiteral(source)}
      ${mode === 'errors' ? safeSql`and ${statusCode} >= 400` : safeSql``}
      ${generateReportFiltersOtel(filters, source)}
    group by path, method, search, status_code
    order by ${mode === 'slow' ? safeSql`avg` : safeSql`count`} desc
    limit 10
  `
}

export const API_REPORT_QUERIES_OTEL = {
  totalRequests: {
    safeSql: (filters: ReportFilterItem[], source = 'edge_logs') =>
      timeline(filters, source, safeSql`toFloat64(count()) as count`),
  },
  topRoutes: {
    safeSql: (filters: ReportFilterItem[], source = 'edge_logs') =>
      routes(filters, source, 'count'),
  },
  errorCounts: {
    safeSql: (filters: ReportFilterItem[], source = 'edge_logs') =>
      timeline(filters, source, safeSql`toFloat64(count()) as count`, true),
  },
  topErrorRoutes: {
    safeSql: (filters: ReportFilterItem[], source = 'edge_logs') =>
      routes(filters, source, 'errors'),
  },
  responseSpeed: {
    safeSql: (filters: ReportFilterItem[], source = 'edge_logs') =>
      timeline(filters, source, safeSql`avg(${originTime}) as avg`),
  },
  topSlowRoutes: {
    safeSql: (filters: ReportFilterItem[], source = 'edge_logs') => routes(filters, source, 'slow'),
  },
  networkTraffic: {
    safeSql: (filters: ReportFilterItem[], source = 'edge_logs') =>
      timeline(
        filters,
        source,
        safeSql`
      sum(toFloat64OrZero(log_attributes['request.headers.content_length'])) / 1000000 as ingress_mb,
      sum(toFloat64OrZero(log_attributes['response.headers.content_length'])) / 1000000 as egress_mb
    `
      ),
  },
}
