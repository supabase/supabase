import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { workersQueryOptions } from '@/data/workers/workers-query'
import { PRODUCT_NAME } from '@/lib/constants/workers'
import WorkersPage from '@/pages/project/[ref]/workers/index'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type ListWorkersResponse = components['schemas']['V2ListWorkersResponse']
type WorkerDatum = ListWorkersResponse['data'][number]

// `tests/vitestSetup.ts` mocks `common`'s useParams to always answer with this ref, so the page
// reads it no matter what the router URL says.
const PROJECT_REF = 'default'

const workerDatum = (
  id: string,
  attributes: Partial<WorkerDatum['attributes']> = {}
): WorkerDatum => ({
  id,
  type: 'project_worker' as const,
  attributes: {
    build_state: 'active' as const,
    secret_generation: '1',
    spec: { exposure: 'public', instances: 1, runtime: 'node', size: '2gb-1vcpu' },
    ...attributes,
  },
})

const mockWorkersList = (workers: WorkerDatum[]) =>
  addAPIMock({ method: 'get', path: '/v2/projects/:ref/workers', response: { data: workers } })

const mockWorkersListFailure = (status: number) =>
  addAPIMock({
    method: 'get',
    path: '/v2/projects/:ref/workers',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Denied' }, { status }),
  })

// The workers list is platform-only, and `IS_PLATFORM` is false under vitest, so the page's own
// query never leaves the idle state. Filling the cache imperatively still goes through MSW, and
// the page reads whatever landed there.
const renderWorkersPage = async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await queryClient
    .fetchQuery(workersQueryOptions({ projectRef: PROJECT_REF }))
    .catch(() => undefined)

  return customRender(<WorkersPage dehydratedState={undefined} />, { queryClient })
}

describe('/project/[ref]/workers', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl(`/project/${PROJECT_REF}/workers`)
  })

  it('lists the workers the API returns', async () => {
    mockWorkersList([
      workerDatum('embed'),
      workerDatum('resize', {
        build_state: 'building',
        spec: { exposure: 'private', instances: 2, runtime: 'python', size: '4gb-2vcpu' },
      }),
    ])

    await renderWorkersPage()

    expect(screen.getByRole('link', { name: 'embed' })).toHaveAttribute(
      'href',
      `/project/${PROJECT_REF}/workers/embed`
    )
    expect(screen.getByRole('link', { name: 'resize' })).toBeVisible()
    expect(screen.getByText('Active')).toBeVisible()
    expect(screen.getByText('Building')).toBeVisible()
    expect(screen.getByText('Python 3.14')).toBeVisible()
    expect(screen.getByText('4 GB · 2 vCPU · 2 inst')).toBeVisible()
  })

  it('invites you to deploy one when the project has none', async () => {
    mockWorkersList([])

    await renderWorkersPage()

    expect(screen.getByText(/No workers yet/)).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('explains that a project outside the alpha is not enrolled', async () => {
    mockWorkersListFailure(404)

    await renderWorkersPage()

    expect(screen.getByText(`${PRODUCT_NAME} is not enabled for this project`)).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('asks for permissions when the project is enrolled but the caller is not allowed', async () => {
    mockWorkersListFailure(403)

    await renderWorkersPage()

    expect(
      screen.getByText("You need additional permissions to view this project's workers")
    ).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
