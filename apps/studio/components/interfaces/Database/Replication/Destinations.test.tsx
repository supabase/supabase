import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { useQueryState } from 'nuqs'
import { beforeEach, expect, test, vi } from 'vitest'

import { Destinations } from './Destinations'
import { replicationKeys } from '@/data/replication/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()
const options = vi.hoisted(() => ({
  legacy: false,
  hasAccess: true,
  isLoading: false,
  failEnable: false,
  failRefresh: false,
}))
vi.mock('./useIsETLPrivateAlpha', () => ({
  useIsETLBigQueryPrivateAlpha: () => !options.legacy,
  useIsETLIcebergPrivateAlpha: () => options.legacy,
  useIsETLDucklakePrivateAlpha: () => false,
  useIsETLSnowflakePrivateAlpha: () => false,
  useIsETLClickHousePrivateAlpha: () => false,
}))
vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({ hasAccess: options.hasAccess, isLoading: options.isLoading }),
}))
vi.mock('./DestinationPanel/DestinationPanel', () => ({
  DestinationPanel: () => {
    const [type] = useQueryState('destinationType')
    return type ? <h2>Creation sheet: {type}</h2> : null
  },
}))
let isEnabled = false
let enableGate: Promise<void> | undefined
beforeEach(() => {
  isEnabled = false
  enableGate = undefined
  options.legacy = false
  options.hasAccess = true
  options.isLoading = false
  options.failRefresh = false
  options.failEnable = false
  mswServer.use(
    http.get('http://localhost:3000/api/enabled-features-overrides', () =>
      HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
    )
  )
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () =>
      HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({ destinations: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({ pipelines: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () =>
      options.failRefresh && isEnabled
        ? HttpResponse.json<APIErrorBody>(
            { message: 'replication API URL is not configured' },
            { status: 503 }
          )
        : HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
            sources: isEnabled
              ? [
                  {
                    id: 42,
                    name: 'default',
                    tenant_id: 'tenant',
                    config: {
                      host: 'localhost',
                      port: 5432,
                      name: 'postgres',
                      username: 'postgres',
                    },
                  },
                ]
              : [],
          }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/tenants-sources',
    response: async () => {
      await enableGate
      if (options.failEnable) {
        options.failEnable = false
        return HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 })
      }
      isEnabled = true
      return HttpResponse.json<components['schemas']['CreateTenantSourceResponse_Output']>({
        source_id: 42,
        tenant_id: 'tenant',
      })
    },
  })
})
const renderList = async (waitForSources = true) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = customRender(<Destinations />, { queryClient, nuqs: { hasMemory: true } })
  await screen.findByRole('heading', { name: 'Add a pipeline' })
  if (waitForSources)
    await waitFor(() =>
      expect(queryClient.getQueryState(replicationKeys.sources('default'))?.status).toBe('success')
    )
  return view
}
const addPipeline = () =>
  fireEvent.click(screen.getAllByRole('button', { name: 'Add pipeline' })[0])
test.each([true, false, 'retry', 'refresh error'])(
  'opens creation after enabling when needed (enabled: %s)',
  async (enabled) => {
    isEnabled = enabled === true
    options.failEnable = enabled === 'retry'
    const view = await renderList()
    options.failRefresh = enabled === 'refresh error'
    options.isLoading = enabled !== true
    options.hasAccess = !options.isLoading
    addPipeline()
    if (enabled !== true) {
      expect(screen.getByText('Checking Pipelines access…')).toBeInTheDocument()
      expect(screen.queryByText('Pipelines requires the Pro plan.')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Enable' })).toBeDisabled()
      options.isLoading = false
      options.hasAccess = true
      view.rerender(<Destinations />)
      fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
      if (enabled === 'retry') {
        await waitFor(() => expect(options.failEnable).toBe(false))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Enable' })).toBeEnabled())
        expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
      }
    }
    if (enabled === 'refresh error') {
      await screen.findByRole('button', { name: 'Retry' })
      expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
      options.failRefresh = false
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: 'Add pipeline' })[0]).not.toHaveAttribute(
          'aria-disabled',
          'true'
        )
      )
      addPipeline()
    }
    await screen.findByRole('heading', { name: 'Creation sheet: BigQuery' })
  }
)
test('dismissal during enablement prevents a late response opening creation', async () => {
  let finish: (() => void) | undefined
  enableGate = new Promise<void>((resolve) => {
    finish = resolve
  })
  await renderList()
  addPipeline()
  fireEvent.click(await screen.findByRole('button', { name: 'Enable' }))
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  finish?.()
  fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }), {
    button: 0,
    ctrlKey: false,
  })
  expect(await screen.findByRole('menuitem', { name: 'Disable Pipelines' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
})
test('creation defaults to BigQuery regardless of legacy destination flags', async () => {
  options.legacy = true
  isEnabled = true
  await renderList()
  addPipeline()
  await screen.findByRole('heading', { name: 'Creation sheet: BigQuery' })
})
test.each(['loading', 'error'])('blocks creation when source status is %s', async (state) => {
  let finish: (() => void) | undefined
  let hasFailed = false
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: async () => {
      if (state === 'loading')
        await new Promise<void>((resolve) => {
          finish = resolve
        })
      if (state === 'error' && !hasFailed) {
        hasFailed = true
        return HttpResponse.json<APIErrorBody>(
          { message: 'replication API URL is not configured' },
          { status: 503 }
        )
      }
      return HttpResponse.json<components['schemas']['SourcesResponse_Output']>({ sources: [] })
    },
  })
  await renderList(false)
  if (state === 'error') {
    await screen.findByRole('button', { name: 'Retry' })
    const button = screen.getAllByRole('button', { name: 'Add pipeline' })[0]
    expect(button).toHaveAttribute('aria-disabled', 'true')
    fireEvent.focus(button)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Replication unavailable locally')
  } else {
    expect(screen.getAllByRole('button', { name: 'Add pipeline' })[0]).toBeDisabled()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  }
  addPipeline()
  fireEvent.keyDown(document, { key: 'N', shiftKey: true })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
  if (state === 'error') fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
  else {
    await waitFor(() => expect(finish).toBeDefined())
    finish?.()
  }
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: 'Add pipeline' })[0]).toBeEnabled()
  )
  addPipeline()
  expect(await screen.findByRole('dialog')).toHaveTextContent('Enable Pipelines')
})
