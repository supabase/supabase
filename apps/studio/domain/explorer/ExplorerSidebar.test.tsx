import { RegistryProvider } from '@effect/atom-react'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Explorer } from './Explorer'
import type { components } from '@/data/api'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const renderExplorer = () =>
  customRender(
    <RegistryProvider>
      <Explorer />
    </RegistryProvider>
  )

class FakeIntersectionObserver {
  static instances: Array<FakeIntersectionObserver> = []

  private callback: IntersectionObserverCallback
  private target: Element | undefined

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }

  observe(target: Element) {
    this.target = target
  }
  unobserve() {}
  disconnect() {}

  trigger(isIntersecting: boolean) {
    if (!this.target) return
    this.callback(
      [{ isIntersecting, target: this.target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
}
vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)

type NotebookRow = components['schemas']['GetUserContentResponse']['data'][number]

const notebookRow = (overrides: Partial<NotebookRow>): NotebookRow => ({
  id: 'd3aadd77-7c3c-4de7-aa5c-5aa8ac270b44',
  type: 'notebook',
  name: 'Signup funnel',
  description: '',
  favorite: false,
  folder_id: null,
  inserted_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  visibility: 'project',
  owner_id: 1,
  project_id: 1,
  owner: { id: 1, username: 'test' },
  updated_by: { id: 1, username: 'test' },
  content: { schema_version: 1, cells: [] },
  ...overrides,
})

const mockNotebooksPage = (data: Array<NotebookRow>) =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/content',
    response: () =>
      HttpResponse.json<components['schemas']['GetUserContentResponse']>({
        cursor: undefined,
        data,
      }),
  })

const mockPaginatedNotebooks = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/content',
    response: ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor')

      return HttpResponse.json<components['schemas']['GetUserContentResponse']>(
        cursor === 'page-2'
          ? { cursor: undefined, data: [notebookRow({ id: 'b', name: 'Churn report' })] }
          : { cursor: 'page-2', data: [notebookRow({ id: 'a', name: 'Signup funnel' })] }
      )
    },
  })

describe('ExplorerSidebar', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = []
  })

  it('loads the next page when the sentinel intersects', async () => {
    mockPaginatedNotebooks()

    renderExplorer()

    expect(await screen.findByText('Signup funnel')).toBeInTheDocument()
    expect(screen.queryByText('Churn report')).not.toBeInTheDocument()

    const observer = FakeIntersectionObserver.instances.at(-1)
    act(() => observer?.trigger(true))

    expect(await screen.findByText('Churn report')).toBeInTheDocument()
  })

  it('shows a loading state while the first page is in flight', async () => {
    let resolveResponse!: (page: components['schemas']['GetUserContentResponse']) => void
    const pending = new Promise<components['schemas']['GetUserContentResponse']>((resolve) => {
      resolveResponse = resolve
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: async () =>
        HttpResponse.json<components['schemas']['GetUserContentResponse']>(await pending),
    })

    renderExplorer()

    const sidebar = screen.getByRole('complementary', { name: 'Notebooks' })
    expect(within(sidebar).getAllByTestId('notebooks-skeleton').length).toBeGreaterThan(0)

    resolveResponse({
      cursor: undefined,
      data: [notebookRow({ id: 'a', name: 'Signup funnel' })],
    })

    expect(await within(sidebar).findByText('Signup funnel')).toBeInTheDocument()
  })

  it('renders the first page of notebooks', async () => {
    mockNotebooksPage([
      notebookRow({ id: 'a', name: 'Signup funnel' }),
      notebookRow({ id: 'b', name: 'Churn report' }),
    ])

    renderExplorer()

    expect(await screen.findByText('Signup funnel')).toBeInTheDocument()
    expect(screen.getByText('Churn report')).toBeInTheDocument()
  })

  it('shows an empty state when the project has no notebooks', async () => {
    mockNotebooksPage([])

    renderExplorer()

    expect(await screen.findByText('No notebooks yet')).toBeInTheDocument()
  })

  it('shows an error state when the request fails', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })

    renderExplorer()

    expect(await screen.findByText('Failed to load notebooks')).toBeInTheDocument()
  })

  it('opens a tab for a notebook when it is clicked', async () => {
    mockNotebooksPage([notebookRow({ id: 'a', name: 'Signup funnel' })])
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentByIdResponse']>({
          id: 'a',
          type: 'notebook',
          name: 'Signup funnel',
          description: '',
          favorite: false,
          folder_id: null,
          inserted_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          visibility: 'project',
          owner_id: 1,
          project_id: 1,
          content: { schema_version: 1, cells: [] },
        }),
    })

    renderExplorer()

    const sidebar = screen.getByRole('complementary', { name: 'Notebooks' })
    const tablist = screen.getByRole('tablist', { name: 'Explorer tabs' })

    await userEvent.click(await within(sidebar).findByText('Signup funnel'))

    expect(await within(tablist).findByRole('tab', { name: /Signup funnel/ })).toBeInTheDocument()
  })
})
