import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { AlertIssueComments } from './AlertIssueComments'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const COMMENTS_URL = `${API_URL}/platform/projects/:ref/alerts/issues/:alertIssueId/comments`

const comment = (id: string, body: string) => ({
  comment_id: id,
  alert_issue_id: 'a1',
  author: 'self-hosted',
  body,
  created_at: new Date().toISOString(),
})

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
})
