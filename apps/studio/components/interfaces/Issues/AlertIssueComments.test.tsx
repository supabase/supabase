import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { AlertIssueComments } from './AlertIssueComments'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const COMMENTS_URL = `${API_URL}/platform/projects/:ref/alerts/issues/:alertIssueId/comments`

const comment = (id: string, body: string, author = 'self-hosted') => ({
  comment_id: id,
  alert_issue_id: 'a1',
  author,
  body,
  created_at: new Date().toISOString(),
})

const thread = [
  comment('c1', '@assistant why is this failing?'),
  comment('c2', 'The upstream API is timing out.', 'Supabase Assistant'),
]

afterEach(() => localStorage.removeItem(LOCAL_STORAGE_KEYS.ALERT_ISSUES_OUT_OF_SCOPE_VISIBLE))

describe('AlertIssueComments', () => {
  it('lists comments and adds a new one', async () => {
    let received: unknown
    mswServer.use(
      http.get(COMMENTS_URL, () => HttpResponse.json([comment('c1', 'Looking into it')])),
      http.post(COMMENTS_URL, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(comment('c2', 'Rotated the webhook secret'), { status: 201 })
      })
    )

    customRender(<AlertIssueComments projectRef="default" alertIssueId="a1" />)

    expect(await screen.findByText('Looking into it')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Add a comment'), 'Rotated the webhook secret')
    // jsdom doesn't submit forms from a submit button click, like the other Studio form tests.
    fireEvent.submit(screen.getByRole('button', { name: 'Comment' }).closest('form')!)

    await waitFor(() => expect(received).toEqual({ body: 'Rotated the webhook secret' }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('Rotated the webhook secret')
    expect(screen.getByLabelText('Add a comment')).toHaveValue('')
  })

  it('shows an empty state without comments', async () => {
    mswServer.use(http.get(COMMENTS_URL, () => HttpResponse.json([])))

    customRender(<AlertIssueComments projectRef="default" alertIssueId="a1" />)

    expect(await screen.findByText('No comments yet')).toBeInTheDocument()
  })

  it('hides assistant replies and mentions while out-of-scope features are hidden', async () => {
    mswServer.use(http.get(COMMENTS_URL, () => HttpResponse.json(thread)))

    customRender(<AlertIssueComments projectRef="default" alertIssueId="a1" />)

    expect(await screen.findByText('@assistant why is this failing?')).toBeInTheDocument()
    expect(screen.queryByText('The upstream API is timing out.')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toHaveAttribute(
      'placeholder',
      'Add a comment'
    )
  })

  it('shows assistant replies and mentions when out-of-scope features are shown', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ALERT_ISSUES_OUT_OF_SCOPE_VISIBLE, 'true')
    mswServer.use(http.get(COMMENTS_URL, () => HttpResponse.json(thread)))

    customRender(<AlertIssueComments projectRef="default" alertIssueId="a1" />)

    expect(await screen.findByText('The upstream API is timing out.')).toBeInTheDocument()
    expect(screen.getByText('@assistant')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toHaveAttribute(
      'placeholder',
      'Add a comment, or mention @assistant'
    )
  })
})
