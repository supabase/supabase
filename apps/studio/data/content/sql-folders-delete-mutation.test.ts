import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { deleteSQLSnippetFolders } from './sql-folders-delete-mutation'
import { addAPIMock } from '@/tests/lib/msw'

describe('deleteSQLSnippetFolders', () => {
  it('sends folder IDs as the comma-delimited query value required by the API', async () => {
    let ids: string | null = null

    addAPIMock({
      method: 'delete',
      path: '/platform/projects/:ref/content/folders',
      response: ({ request }) => {
        ids = new URL(request.url).searchParams.get('ids')
        return HttpResponse.json({})
      },
    })

    await deleteSQLSnippetFolders({
      projectRef: 'default',
      ids: ['folder-one', 'folder-two'],
    })

    expect(ids).toBe('folder-one,folder-two')
  })
})
