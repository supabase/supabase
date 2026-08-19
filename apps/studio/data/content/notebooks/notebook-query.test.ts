import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getNotebook } from './notebook-query'
import type { components } from '@/data/api'
import { addAPIMock } from '@/tests/lib/msw'

const NOTEBOOK_ID = 'd3aadd77-7c3c-4de7-aa5c-5aa8ac270b44'

// `type: 'notebook'` isn't in the generated GetUserContentByIdResponse['type'] enum yet (same
// gap tracked by the ContentBase TODO in content-query.ts), so the mock body needs a cast.
const NOTEBOOK_ROW = {
  id: NOTEBOOK_ID,
  type: 'notebook',
  name: 'Signup funnel',
  description: '',
  favorite: false,
  folder_id: null,
  inserted_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  visibility: 'project',
  owner_id: 1,
  project_id: 1,
  content: {
    schema_version: 1,
    cells: [],
  },
}

describe('getNotebook', () => {
  it('returns notebook data when the fetched content is type: notebook', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentByIdResponse']>(
          NOTEBOOK_ROW as unknown as components['schemas']['GetUserContentByIdResponse']
        ),
    })

    const result = await getNotebook({ projectRef: 'default', id: NOTEBOOK_ID })

    expect(result.type).toBe('notebook')
    expect(result.content).toEqual({ schema_version: 1, cells: [] })
  })

  it('throws when the fetched content is not a notebook', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentByIdResponse']>({
          id: NOTEBOOK_ID,
          type: 'report',
          name: 'A report',
          description: '',
          favorite: false,
          folder_id: null,
          inserted_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          visibility: 'project',
          owner_id: 1,
          project_id: 1,
          content: {},
        }),
    })

    await expect(getNotebook({ projectRef: 'default', id: NOTEBOOK_ID })).rejects.toThrow(
      /is not a notebook/
    )
  })
})
