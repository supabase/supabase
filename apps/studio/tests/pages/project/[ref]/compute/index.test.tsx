import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { computeQueryOptions } from '@/data/compute/compute-query'
import { PRODUCT_NAME } from '@/lib/constants/compute'
import ComputePage from '@/pages/project/[ref]/compute/index'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type ListWorkersResponse = components['schemas']['V2ListWorkersResponse_Output']
type WorkerDatum = ListWorkersResponse['data'][number]

// `tests/vitestSetup.ts` mocks `common`'s useParams to always answer with this ref, so the page
// reads it no matter what the router URL says.
const PROJECT_REF = 'default'

const computeInstanceDatum = (
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

const mockComputeInstancesList = (instances: WorkerDatum[]) =>
  addAPIMock({ method: 'get', path: '/v2/projects/:ref/workers', response: { data: instances } })

const mockComputeInstancesListFailure = (status: number) =>
  addAPIMock({
    method: 'get',
    path: '/v2/projects/:ref/workers',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Denied' }, { status }),
  })

// The compute list is platform-only, and `IS_PLATFORM` is false under vitest, so the page's own
// query never leaves the idle state. Filling the cache imperatively still goes through MSW, and
// the page reads whatever landed there.
const renderComputePage = async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await queryClient
    .fetchQuery(computeQueryOptions({ projectRef: PROJECT_REF }))
    .catch(() => undefined)

  return customRender(<ComputePage dehydratedState={undefined} />, { queryClient })
}

describe('/project/[ref]/compute', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl(`/project/${PROJECT_REF}/compute`)
  })

  it('lists the instances the API returns', async () => {
    mockComputeInstancesList([
      computeInstanceDatum('embed'),
      computeInstanceDatum('resize', {
        build_state: 'building',
        spec: { exposure: 'private', instances: 2, runtime: 'python', size: '4gb-2vcpu' },
      }),
    ])

    await renderComputePage()

    expect(screen.getByRole('link', { name: 'embed' })).toHaveAttribute(
      'href',
      `/project/${PROJECT_REF}/compute/embed`
    )
    expect(screen.getByRole('link', { name: 'resize' })).toBeVisible()
    expect(screen.getByText('Active')).toBeVisible()
    expect(screen.getByText('Building')).toBeVisible()
    expect(screen.getByText('Python 3.14')).toBeVisible()
    expect(screen.getByText('4 GB · 2 vCPU · 2 inst')).toBeVisible()
  })

  it('invites you to deploy one when the project has none', async () => {
    mockComputeInstancesList([])

    await renderComputePage()

    expect(screen.getByText('Deploy your first Compute instance')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('refreshes the instances list on request', async () => {
    mockComputeInstancesList([computeInstanceDatum('existing')])

    await renderComputePage()

    mockComputeInstancesList([computeInstanceDatum('embed')])
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(await screen.findByRole('link', { name: 'embed' })).toBeVisible()
  })

  it('explains that a project outside the alpha is not enrolled', async () => {
    mockComputeInstancesListFailure(404)

    await renderComputePage()

    expect(screen.getByText(`${PRODUCT_NAME} is not enabled for this project`)).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('asks for permissions when the project is enrolled but the caller is not allowed', async () => {
    mockComputeInstancesListFailure(403)

    await renderComputePage()

    expect(
      screen.getByText("You need additional permissions to view this project's compute instances")
    ).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('allows retrying an unexpected error', async () => {
    let requestCount = 0
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/workers',
      response: (): HttpResponse<APIErrorBody> | HttpResponse<ListWorkersResponse> => {
        if (requestCount++ === 0) {
          return HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 500 })
        }

        return HttpResponse.json<ListWorkersResponse>({ data: [computeInstanceDatum('embed')] })
      },
    })

    await renderComputePage()

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(await screen.findByRole('link', { name: 'embed' })).toBeVisible()
  })
})
