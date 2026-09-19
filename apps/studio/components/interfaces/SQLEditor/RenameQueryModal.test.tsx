import { untrustedSql } from '@supabase/pg-meta'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { RenameQueryModal } from './RenameQueryModal'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

mockAnimationsApi()

const createSnippet = (id: string, name: string): SnippetWithContent => ({
  id,
  name,
  description: undefined,
  status: 'saved',
  visibility: 'user',
  owner_id: 1,
  project_id: 1,
  favorite: false,
  inserted_at: '2026-08-07T14:19:25.711Z',
  updated_at: '2026-08-07T14:19:25.711Z',
  folder_id: 'private-folder',
  type: 'sql',
  content: {
    content_id: id,
    schema_version: '1',
    unchecked_sql: untrustedSql('select 1;'),
  },
})

const SNIPPET_A = createSnippet('snippet-a', 'First query')
const SNIPPET_B = createSnippet('snippet-b', 'Second query')
const UNTITLED_A = createSnippet('untitled-a', 'Untitled query')
const UNTITLED_B = createSnippet('untitled-b', 'Untitled query')

/** The modal renders the AI title generator, which checks for an OpenAI key when self-hosted. */
const mockOpenAIKeyCheck = () =>
  mswServer.use(
    http.get('*/api/ai/sql/check-api-key', () => HttpResponse.json({ hasKey: false })),
    http.get('*/platform/projects/default', () => HttpResponse.json({}, { status: 404 }))
  )

const mockUpsert = () => {
  const requests: Array<{ name: string; id: string }> = []
  addAPIMock({
    method: 'put',
    path: '/platform/projects/:ref/content',
    response: async ({ request }) => {
      const body = (await request.json()) as { id: string; name: string }
      requests.push({ id: body.id, name: body.name })
      return HttpResponse.json({ ...SNIPPET_A, ...body })
    },
  })
  return requests
}

const getNameInput = () => screen.getByLabelText('Name')

describe('RenameQueryModal', () => {
  test('submits the new name for the selected snippet', async () => {
    mockOpenAIKeyCheck()
    const requests = mockUpsert()
    const onComplete = vi.fn()

    customRender(
      <RenameQueryModal snippet={SNIPPET_A} visible onCancel={vi.fn()} onComplete={onComplete} />
    )

    await userEvent.clear(getNameInput())
    await userEvent.type(getNameInput(), 'Renamed query')
    fireEvent.click(screen.getByRole('button', { name: 'Rename query' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
    expect(requests).toEqual([{ id: 'snippet-a', name: 'Renamed query' }])
  })

  test('shows the next snippet name after a successful rename (FE-4114)', async () => {
    mockOpenAIKeyCheck()
    mockUpsert()
    const onComplete = vi.fn()

    const { rerender } = customRender(
      <RenameQueryModal snippet={SNIPPET_A} visible onCancel={vi.fn()} onComplete={onComplete} />
    )

    await userEvent.clear(getNameInput())
    await userEvent.type(getNameInput(), 'Renamed query')
    fireEvent.click(screen.getByRole('button', { name: 'Rename query' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())

    // The parent closes the modal, then reopens it for a different snippet
    rerender(
      <RenameQueryModal
        snippet={SNIPPET_A}
        visible={false}
        onCancel={vi.fn()}
        onComplete={onComplete}
      />
    )
    rerender(
      <RenameQueryModal snippet={SNIPPET_B} visible onCancel={vi.fn()} onComplete={onComplete} />
    )

    await waitFor(() => expect(getNameInput()).toHaveValue('Second query'))
    // Nothing has changed yet, so there is nothing to submit
    expect(screen.getByRole('button', { name: 'Rename query' })).toBeDisabled()
  })

  test('resets for the next snippet when both snippets share a name', async () => {
    mockOpenAIKeyCheck()
    const requests = mockUpsert()
    const onComplete = vi.fn()

    const { rerender } = customRender(
      <RenameQueryModal snippet={UNTITLED_A} visible onCancel={vi.fn()} onComplete={onComplete} />
    )

    await userEvent.clear(getNameInput())
    await userEvent.type(getNameInput(), 'Renamed query')
    fireEvent.click(screen.getByRole('button', { name: 'Rename query' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())

    // The parent keeps the renamed snippet selected while closing the modal, then reopens it for
    // a second snippet that still carries the same original name
    rerender(
      <RenameQueryModal
        snippet={UNTITLED_A}
        visible={false}
        onCancel={vi.fn()}
        onComplete={onComplete}
      />
    )
    rerender(
      <RenameQueryModal snippet={UNTITLED_B} visible onCancel={vi.fn()} onComplete={onComplete} />
    )

    await waitFor(() => expect(getNameInput()).toHaveValue('Untitled query'))

    await userEvent.clear(getNameInput())
    await userEvent.type(getNameInput(), 'Second renamed query')
    fireEvent.click(screen.getByRole('button', { name: 'Rename query' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2))
    expect(requests).toEqual([
      { id: 'untitled-a', name: 'Renamed query' },
      { id: 'untitled-b', name: 'Second renamed query' },
    ])
  })

  test('discards an abandoned edit when cancelled', async () => {
    mockOpenAIKeyCheck()
    const onCancel = vi.fn()

    const { rerender } = customRender(
      <RenameQueryModal snippet={SNIPPET_A} visible onCancel={onCancel} onComplete={vi.fn()} />
    )

    await userEvent.clear(getNameInput())
    await userEvent.type(getNameInput(), 'Half-typed name')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()

    rerender(
      <RenameQueryModal
        snippet={SNIPPET_A}
        visible={false}
        onCancel={onCancel}
        onComplete={vi.fn()}
      />
    )
    rerender(
      <RenameQueryModal snippet={SNIPPET_A} visible onCancel={onCancel} onComplete={vi.fn()} />
    )

    await waitFor(() => expect(getNameInput()).toHaveValue('First query'))
  })
})
