import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getSQLSnippetFolderContents } from './sql-folder-contents-query'
import { addAPIMock } from '@/tests/lib/msw'

type GetUserContentFolderResponse = components['schemas']['GetUserContentFolderResponse']

const SNIPPET_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'
const FOLDER_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'

/** Self-hosted folder listings include inline SQL under `content.sql`. */
function createFolderContentsResponseWithInlineSql(sql: string): GetUserContentFolderResponse {
  return {
    data: {
      folders: [],
      contents: [
        {
          id: SNIPPET_ID,
          type: 'sql',
          name: 'Folder query',
          description: '',
          favorite: false,
          folder_id: FOLDER_ID,
          inserted_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          visibility: 'user',
          owner_id: 1,
          project_id: 1,
          content: {
            sql,
            content_id: SNIPPET_ID,
            schema_version: '1.0',
          },
        },
      ],
    },
  } as GetUserContentFolderResponse
}

describe('getSQLSnippetFolderContents', () => {
  it('remaps inline content.sql to unchecked_sql', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/folders/:id',
      response: () =>
        HttpResponse.json<GetUserContentFolderResponse>(
          createFolderContentsResponseWithInlineSql('SELECT * FROM users')
        ),
    })

    const result = await getSQLSnippetFolderContents({
      projectRef: 'default',
      folderId: FOLDER_ID,
    })

    expect(result.contents).toHaveLength(1)
    expect(result.contents[0].status).toBe('saved')
    expect(result.contents[0].content?.unchecked_sql).toBeDefined()
    expect(result.contents[0].content).not.toHaveProperty('sql')
  })
})
