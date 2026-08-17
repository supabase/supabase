import { describe, expect, it } from 'vitest'

import { serializeTroubleshootingIndexEntry } from './troubleshooting-index'

describe('serializeTroubleshootingIndexEntry', () => {
  it('includes structured metadata for agents', () => {
    const markdown = serializeTroubleshootingIndexEntry(
      {
        title: 'Requests return 42501 errors',
        topics: ['api', 'database'],
        summary: 'The database role does not have permission for the requested operation.',
        diagnostic_sources: ['api-logs', 'postgres-logs'],
        errors: [
          { http_status_code: 403, code: '42501' },
          { message: 'permission denied for table' },
        ],
      },
      'https://supabase.com/docs/guides/troubleshooting/example.md'
    )

    expect(markdown).toContain(
      'Symptom or error: [**Requests return 42501 errors**](https://supabase.com/docs/guides/troubleshooting/example.md)'
    )
    expect(markdown).toContain('Product: api, database')
    expect(markdown).toContain('Where to check: API logs, Postgres logs')
    expect(markdown).toContain('Likely meaning: The database role does not have permission')
    expect(markdown).toContain('Errors: 403 42501')
    expect(markdown).toContain('permission denied for table')
    expect(markdown).not.toContain('Canonical guide')
  })

  it('rejects entries that have not completed the metadata migration', () => {
    expect(() =>
      serializeTroubleshootingIndexEntry(
        { title: 'Existing guide', topics: ['database'] },
        'https://supabase.com/docs/guides/troubleshooting/existing'
      )
    ).toThrow()
  })
})
