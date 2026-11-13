import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'

import { API_URL } from '@/lib/constants'
import { Route } from '@/routes/integrations/vercel/$slug/deploy-button/new-project'
import { mswServer } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: () => ({ slug: 'acme', currentProjectId: 'vercel-project-id' }),
  }
})

vi.mock('@/components/interfaces/ProjectCreation/ProjectCreationForm', () => ({
  ProjectCreationForm: ({ onCreateSuccess }: { onCreateSuccess: (ref: string) => void }) => (
    <button tabIndex={0} onClick={() => onCreateSuccess('project-ref')}>
      Create project
    </button>
  ),
}))

test('shows a recoverable partial-success state without recreating the project', async () => {
  const user = userEvent.setup()
  let connectionRequests = 0

  mswServer.use(
    http.get(`${API_URL}/platform/integrations`, () =>
      HttpResponse.json([{ id: 'org-integration-id', organization: { slug: 'acme' } }])
    ),
    http.get(`${API_URL}/platform/integrations/vercel/projects/:id`, () =>
      HttpResponse.json({ projects: [] })
    ),
    http.get(`${API_URL}/platform/projects/:ref/settings`, () =>
      HttpResponse.json({ service_api_keys: [{ tags: 'anon' }] })
    ),
    http.post(`${API_URL}/platform/integrations/vercel/connections`, () => {
      connectionRequests += 1
      return connectionRequests === 1
        ? HttpResponse.json({ message: 'Connection request failed' }, { status: 500 })
        : HttpResponse.json({})
    })
  )

  await renderRoute(Route, {
    routeId: '/integrations/vercel/$slug/deploy-button/new-project',
    url: '/integrations/vercel/acme/deploy-button/new-project',
  })

  await user.click(await screen.findByRole('button', { name: 'Create project' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Unable to connect to Vercel')
  expect(alert).toHaveTextContent(
    'Your Supabase project was still created. Error: Connection request failed'
  )
  expect(screen.getByRole('link', { name: 'Open project' })).toHaveAttribute(
    'href',
    '/project/project-ref'
  )

  await user.click(screen.getByRole('button', { name: 'Retry connection' }))

  expect(await screen.findByText('Project connected')).toBeInTheDocument()
  expect(connectionRequests).toBe(2)
  expect(screen.queryByRole('button', { name: 'Create project' })).not.toBeInTheDocument()
})
