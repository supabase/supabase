import { describe, expect, it } from 'vitest'

import {
  getLogsChartQuery,
  getLogsCountQuery,
  getUnifiedLogsQuery,
} from '../UnifiedLogs.queries.bq'
import { createUnifiedLogsSearch } from '../UnifiedLogs.utils'
import { getAuthServiceFlowQuery } from './ServiceFlowQueries/ServiceFlow.sql'

const search = createUnifiedLogsSearch({
  filter: ['log_type:eq:auth', 'status:eq:500', 'level:eq:error'],
})

describe('legacy Auth request metadata', () => {
  it.each([
    ['rows', () => getUnifiedLogsQuery(search)],
    ['chart', () => getLogsChartQuery(search)],
    ['counts', () => getLogsCountQuery(search)],
    ['inspection', () => getAuthServiceFlowQuery('auth-id')],
  ] as const)('uses Auth status before gateway enrichment for %s', (_, buildQuery) => {
    const sql = buildQuery()
    const status = sql.slice(sql.indexOf('COALESCE('), sql.indexOf(') AS STRING) as status'))
    const fields = [
      "json_value(al.event_message, '$.status')",
      "regexp_extract(json_value(al.event_message, '$.msg'), r'^([0-9]{3})\\b')",
      "regexp_extract(json_value(al.event_message, '$.error'), r'^([0-9]{3})\\b')",
      "json_value(to_json_string(al_metadata), '$.status')",
      'edge_logs_response.status_code',
    ]
    for (let index = 0; index < fields.length; index++) {
      expect(status).toContain(fields[index])
      if (index > 0)
        expect(status.indexOf(fields[index])).toBeGreaterThan(status.indexOf(fields[index - 1]))
    }
    expect(sql).toContain("json_value(to_json_string(al_metadata), '$.request_id')")
    expect(sql).toContain("json_value(al.event_message, '$.request_id')")
    expect(sql).not.toContain('al_metadata.request_id')
    expect(sql).toContain(
      "json_value(al.event_message, '$.path'), json_value(to_json_string(al_metadata), '$.path'), edge_logs_request.path"
    )
    expect(sql).toContain(
      "json_value(al.event_message, '$.method'), json_value(to_json_string(al_metadata), '$.method'), edge_logs_request.method"
    )
    expect(sql).toMatch(/WHEN COALESCE\([\s\S]*?\) >= 500 THEN 'error'/)
  })
})
