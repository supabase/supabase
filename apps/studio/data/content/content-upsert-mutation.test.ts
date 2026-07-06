import { untrustedSql } from '@supabase/pg-meta'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { upsertContent } from './content-upsert-mutation'
import { addAPIMock } from '@/tests/lib/msw'

const SNIPPET_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const FOLDER_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'

const payload = {
  id: SNIPPET_ID,
  type: 'sql' as const,
  name: 'Moved query',
  visibility: 'user' as const,
  project_id: 1,
  owner_id: 1,
  folder_id: FOLDER_ID,
  content: {
    content_id: SNIPPET_ID,
    schema_version: '1.0',
    unchecked_sql: untrustedSql('SELECT 1'),
  },
}

describe('upsertContent', () => {
  it('remaps content.sql to unchecked_sql in the upsert response', async () => {
    // Self-hosted (and the management API) persist + return the SQL body under `content.sql`;
    // the editor reads `content.unchecked_sql`. Move/rename consume this response directly, so it
    // must be remapped — otherwise the editor renders blank until a refetch.
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request }) => {
        const body = (await request.json()) as { id: string; name: string; type: string }
        return HttpResponse.json({
          id: SNIPPET_ID,
          type: 'sql',
          name: body.name,
          description: '',
          favorite: false,
          folder_id: FOLDER_ID,
          inserted_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          visibility: 'user',
          owner_id: 1,
          project_id: 1,
          content: {
            sql: 'SELECT 1',
            content_id: SNIPPET_ID,
            schema_version: '1.0',
          },
        })
      },
    })

    const result = await upsertContent({ projectRef: 'default', payload })

    expect(result?.status).toBe('saved')
    expect(result?.content?.unchecked_sql).toEqual(untrustedSql('SELECT 1'))
    expect(result?.content).not.toHaveProperty('sql')
  })

  it('returns null when the API responds with no snippet', async () => {
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => HttpResponse.json(null),
    })

    const result = await upsertContent({ projectRef: 'default', payload })

    expect(result).toBeNull()
  })
})
