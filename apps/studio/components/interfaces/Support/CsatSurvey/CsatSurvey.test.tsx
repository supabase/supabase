import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { CsatSurvey } from './CsatSurvey'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

// The global test setup stubs useParams; restore the real one so the URL query drives the page.
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: actual.useParams }
})

const CSAT_URL = `${API_URL?.replace('/platform', '')}/platform/support/csat`

const mockSubmit = (status: number, body: JsonBodyType = { result: 'success' }) => {
  const requests: unknown[] = []
  mswServer.use(
    http.post(CSAT_URL, async ({ request }) => {
      requests.push(await request.json())
      return HttpResponse.json(body, { status })
    })
  )
  return requests
}

// Click-to-submit does not work under the test pointer-event polyfill; submit the form directly.
const submitForm = () => {
  const form = screen.getByRole('button', { name: 'Submit' }).closest('form')
  if (!form) throw new Error('Survey form not found')
  fireEvent.submit(form)
}

describe('CsatSurvey', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/support/csat?conversation_id=cnv_1abc2&helpful=yes')
  })

  test('shows the ticket error when the link has no ticket reference', () => {
    routerMock.setCurrentUrl('/support/csat')

    customRender(<CsatSurvey />)

    expect(screen.getByText('Invalid or mismatched ticket')).toBeInTheDocument()
  })

  test('preselects the answer from the link and submits it with a comment', async () => {
    const requests = mockSubmit(200)

    customRender(<CsatSurvey />)

    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.type(screen.getByLabelText(/add a comment/i), 'Quick and helpful')
    submitForm()

    expect(
      await screen.findByText('Survey response recorded. You can now close this window.')
    ).toBeInTheDocument()
    expect(requests).toEqual([
      { conversation_id: 'cnv_1abc2', satisfied: true, comment: 'Quick and helpful' },
    ])
  })

  test('lets the customer change the answer before submitting', async () => {
    const requests = mockSubmit(200)

    customRender(<CsatSurvey />)

    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    submitForm()

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toMatchObject({ conversation_id: 'cnv_1abc2', satisfied: false })
  })

  test('defaults to yes when the link did not preselect an answer', async () => {
    routerMock.setCurrentUrl('/support/csat?conversation_id=cnv_1abc2')
    const requests = mockSubmit(200)

    customRender(<CsatSurvey />)

    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('aria-pressed', 'true')
    submitForm()

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toMatchObject({ conversation_id: 'cnv_1abc2', satisfied: true })
  })

  test('shows the already-submitted error on a 409', async () => {
    mockSubmit(409, { message: 'This survey has already been answered' })

    customRender(<CsatSurvey />)

    submitForm()

    expect(await screen.findByText('This survey has already been submitted')).toBeInTheDocument()
  })

  test('shows the ticket error on a 404', async () => {
    mockSubmit(404, { message: 'No survey was sent for this conversation' })

    customRender(<CsatSurvey />)

    submitForm()

    expect(await screen.findByText('Invalid or mismatched ticket')).toBeInTheDocument()
  })

  test('keeps the form and shows the error on other failures', async () => {
    mockSubmit(500, { message: 'Failed to record survey response' })

    customRender(<CsatSurvey />)

    submitForm()

    expect(await screen.findByText('Failed to record survey response')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })
})
