import { describe, expect, it } from 'vitest'

import { toOtelFieldSchemas, type LogFieldSchema } from './Logs.fieldReference'

const edgeSchema: LogFieldSchema = {
  name: 'API Gateway',
  reference: 'edge_logs',
  fields: [
    { path: 'id', type: 'string' },
    { path: 'timestamp', type: 'datetime' },
    { path: 'event_message', type: 'string' },
    { path: 'identifier', type: 'string' },
    { path: 'metadata.request.method', type: 'string' },
    { path: 'metadata.request.cf.asn', type: 'number' },
  ],
}

describe('toOtelFieldSchemas', () => {
  it('keeps source name and reference', () => {
    const [otel] = toOtelFieldSchemas([edgeSchema])
    expect(otel.name).toBe('API Gateway')
    expect(otel.reference).toBe('edge_logs')
  })

  it('keeps id/timestamp/event_message as real columns and adds source + severity_text', () => {
    const [otel] = toOtelFieldSchemas([edgeSchema])
    const paths = otel.fields.map((f) => f.path)
    expect(paths.slice(0, 5)).toEqual([
      'id',
      'timestamp',
      'event_message',
      'severity_text',
      'source',
    ])
  })

  it('moves non-column fields into log_attributes, dropping the metadata root', () => {
    const [otel] = toOtelFieldSchemas([edgeSchema])
    const paths = otel.fields.map((f) => f.path)
    expect(paths).toContain("log_attributes['identifier']")
    expect(paths).toContain("log_attributes['request.method']")
    expect(paths).toContain("log_attributes['request.cf.asn']")
    // The original BigQuery nested paths are gone.
    expect(paths).not.toContain('metadata.request.method')
    expect(paths).not.toContain('identifier')
  })

  it('preserves the original field type for casting hints', () => {
    const [otel] = toOtelFieldSchemas([edgeSchema])
    const asn = otel.fields.find((f) => f.path === "log_attributes['request.cf.asn']")
    expect(asn?.type).toBe('number')
  })
})
