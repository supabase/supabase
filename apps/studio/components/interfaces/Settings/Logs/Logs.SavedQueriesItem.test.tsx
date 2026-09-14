import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { SavedQueriesItem } from './Logs.SavedQueriesItem'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// SavedQueriesItem renders a Radix dropdown + dialog, both of which use Web Animations.
mockAnimationsApi()

const ITEM_ID = 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22'
const LOGS_SQL =
  "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10"

const item = {
  id: ITEM_ID,
  name: 'My logs query',
  description: 'A saved logs query',
  owner_id: 1,
  content: { unchecked_sql: untrustedLogSql(LOGS_SQL) },
}

describe('SavedQueriesItem', () => {
  it('preserves content.sql (as the raw wire field) and keeps type log_sql when editing a saved logs query', async () => {
    const requests: Array<{ type: string; name: string; content: Record<string, unknown> }> = []
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request }) => {
        requests.push(
          (await request.json()) as { type: string; name: string; content: Record<string, unknown> }
        )
        return HttpResponse.json({
          id: ITEM_ID,
          type: 'log_sql',
          name: 'My logs query (edited)',
          description: 'A saved logs query',
          visibility: 'user',
          owner_id: 1,
          project_id: 1,
          folder_id: null,
          inserted_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          content: { sql: LOGS_SQL, content_id: ITEM_ID, schema_version: '1' },
        })
      },
    })

    customRender(<SavedQueriesItem item={item} />)

    // Open the actions dropdown, then the edit modal.
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByText('Edit query'))

    // Dirty the form so the submit button enables, then submit.
    await userEvent.type(await screen.findByPlaceholderText('Enter text'), ' (edited)')
    fireEvent.click(screen.getByRole('button', { name: 'Save query' }))

    await waitFor(() => expect(requests).toHaveLength(1))

    expect(requests[0].type).toBe('log_sql')
    expect(requests[0].name).toBe('My logs query (edited)')
    expect(requests[0].content.sql).toBe(LOGS_SQL)
    expect(requests[0].content).not.toHaveProperty('unchecked_sql')
  })
})
