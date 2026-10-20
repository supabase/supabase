import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { operations } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { PlatformWebhooksPage } from './PlatformWebhooksPage'
import { resetPendingSigningSecretRevealForTests } from './PlatformWebhooksPage.utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsPlatformWebhooksEnabled: () => true,
  useFeaturePreviewModal: () => ({ selectFeaturePreview: vi.fn() }),
  useFeaturePreviewContext: () => ({ flags: {}, isInitialized: true, onUpdateFlag: vi.fn() }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: undefined }),
}))

mockAnimationsApi()

type EndpointListResponse =
  operations['v2-projects-ref-webhooks-endpoints-get']['responses'][200]['content']['application/json']
type EndpointResource = EndpointListResponse['data'][number]
type EndpointCreateResponse =
  operations['v2-projects-ref-webhooks-endpoints-post']['responses'][201]['content']['application/json']
type EndpointUpdateResponse =
  operations['v2-projects-ref-webhooks-endpoints-id-patch']['responses'][200]['content']['application/json']
type EndpointDeleteResponse =
  operations['v2-projects-ref-webhooks-endpoints-id-delete']['responses'][200]['content']['application/json']
type EndpointTestResponse =
  operations['v2-projects-ref-webhooks-endpoints-id-test-post']['responses'][201]['content']['application/json']
type EndpointCreateRequestBody =
  operations['v2-projects-ref-webhooks-endpoints-post']['requestBody']['content']['application/json']
type EndpointUpdateRequestBody =
  operations['v2-projects-ref-webhooks-endpoints-id-patch']['requestBody']['content']['application/json']
type DeliveryRetryResponse =
  operations['v2-projects-ref-webhooks-deliveries-id-retry-post']['responses'][201]['content']['application/json']
type DeliveryListResponse =
  operations['v2-projects-ref-webhooks-endpoints-id-deliveries-get']['responses'][200]['content']['application/json']
type DeliveryResource = DeliveryListResponse['data'][number]

const ENDPOINT_ID = '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12'
const DELIVERY_ID = '019adf7d-4513-7062-b292-78b86cc470a4'

const ENDPOINT_ATTRIBUTES: EndpointResource['attributes'] = {
  id: ENDPOINT_ID,
  url: 'https://hooks.example.com/project',
  description: '',
  enabled: true,
  event_types: [{ type: 'v1.project.paused' }],
  created_by: 'user@supabase.io',
  created_at: '2026-02-18T11:23:00.000Z',
}

const DELIVERY_ATTRIBUTES: DeliveryResource['attributes'] = {
  id: DELIVERY_ID,
  attempt_timestamp: '2026-02-27T08:04:00.000Z',
  error_code: null,
  error_message: null,
  event: {
    type: 'v1.project.paused',
    timestamp: '2026-02-27T08:04:00.000Z',
    payload: { organization_slug: 'test-org', project_ref: null },
  },
  event_id: 'evt_1',
  response_body: null,
  response_code: 500,
  response_headers: {},
  status: 'failure',
}

const renderPage = (endpointId?: string) =>
  customRender(<PlatformWebhooksPage scope="project" endpointId={endpointId} />)

const mockEndpointsList = (endpoints: EndpointResource[] = []) => {
  addAPIMock({
    method: 'get',
    path: '/v2/projects/:ref/webhooks/endpoints',
    response: () =>
      HttpResponse.json<EndpointListResponse>({
        data: endpoints,
        links: { first: null, last: null, next: null, prev: null },
      }),
  })
}

const mockDeliveriesList = (deliveries: DeliveryResource[] = []) => {
  addAPIMock({
    method: 'get',
    path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
    response: () =>
      HttpResponse.json<DeliveryListResponse>({
        data: deliveries,
        links: { first: null, last: null, next: null, prev: null },
      }),
  })
}

const findMoreActionsButton = () => {
  const button = screen
    .getAllByRole('button')
    .find((b) => b.getAttribute('aria-haspopup') === 'menu')
  if (!button) throw new Error('Could not find the "more actions" dropdown trigger')
  return button
}

beforeEach(() => {
  resetPendingSigningSecretRevealForTests()
})

afterEach(() => {
  resetPendingSigningSecretRevealForTests()
})

describe('PlatformWebhooksPage (project scope)', () => {
  test('renders endpoints fetched from the real list endpoint', async () => {
    mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])

    renderPage()

    expect(await screen.findByText('https://hooks.example.com/project')).toBeInTheDocument()
  })

  test('shows an empty state when there are no endpoints', async () => {
    mockEndpointsList([])

    renderPage()

    expect(await screen.findByText('Create endpoint')).toBeInTheDocument()
  })

  test('creates an endpoint and sends the correctly shaped request body', async () => {
    mockEndpointsList([])

    const requests: Array<{ ref: string | undefined; body: EndpointCreateRequestBody }> = []
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/webhooks/endpoints',
      response: async ({ request, params }) => {
        requests.push({
          ref: params.ref as string | undefined,
          body: (await request.json()) as unknown as EndpointCreateRequestBody,
        })
        return HttpResponse.json<EndpointCreateResponse>(
          { data: { id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES } },
          { status: 201 }
        )
      },
    })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Create endpoint' }))

    const urlInput = await screen.findByPlaceholderText('https://api.example.com/webhooks/supabase')
    await userEvent.type(urlInput, 'https://hooks.example.com/project')
    await userEvent.click(screen.getByRole('checkbox', { name: /subscribe to all events/i }))

    fireEvent.click(screen.getByRole('button', { name: 'Create endpoint' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].ref).toBe('default')
    expect(requests[0].body).toEqual({
      data: {
        type: 'endpoint',
        attributes: expect.objectContaining({
          url: 'https://hooks.example.com/project',
          enabled: true,
          event_types: [{ type: '*' }],
          signing_secret: expect.stringMatching(/^whsec_/),
        }),
      },
    })
    expect(requests[0].body.data.attributes).not.toHaveProperty('custom_headers')
  })

  test('updates an endpoint without rotating the signing secret', async () => {
    const updatedUrl = 'https://hooks.example.com/project-updated'
    mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
    mockDeliveriesList([])

    const requests: Array<{ body: EndpointUpdateRequestBody }> = []
    addAPIMock({
      method: 'patch',
      path: '/v2/projects/:ref/webhooks/endpoints/:id',
      response: async ({ request }) => {
        requests.push({ body: (await request.json()) as unknown as EndpointUpdateRequestBody })
        const updatedAttributes = { ...ENDPOINT_ATTRIBUTES, url: updatedUrl }
        mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: updatedAttributes }])
        return HttpResponse.json<EndpointUpdateResponse>({
          data: { id: ENDPOINT_ID, type: 'endpoint', attributes: updatedAttributes },
        })
      },
    })

    renderPage(ENDPOINT_ID)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    const urlInput = await screen.findByDisplayValue(ENDPOINT_ATTRIBUTES.url)
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, updatedUrl)
    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].body.data.attributes).not.toHaveProperty('signing_secret')
    expect(requests[0].body.data.attributes.url).toBe(updatedUrl)
    await waitFor(() => expect(screen.getAllByText(updatedUrl).length).toBeGreaterThan(0))
  })

  test('deletes an endpoint after confirmation', async () => {
    mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
    mockDeliveriesList([])

    let deleteCalled = false
    addAPIMock({
      method: 'delete',
      path: '/v2/projects/:ref/webhooks/endpoints/:id',
      response: ({ params }) => {
        expect(params.id).toBe(ENDPOINT_ID)
        deleteCalled = true
        return HttpResponse.json<EndpointDeleteResponse>({
          data: { id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES },
        })
      },
    })

    renderPage(ENDPOINT_ID)

    await userEvent.click(await waitFor(() => findMoreActionsButton()))
    fireEvent.click(await screen.findByText('Delete endpoint'))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete endpoint' }))

    await waitFor(() => expect(deleteCalled).toBe(true))
  })

  test('sends a test event', async () => {
    mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
    mockDeliveriesList([])

    let testCalled = false
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/webhooks/endpoints/:id/test',
      response: ({ params }) => {
        expect(params.id).toBe(ENDPOINT_ID)
        testCalled = true
        return HttpResponse.json<EndpointTestResponse>(
          { data: { id: 'evt_1', type: 'ingress' } },
          { status: 201 }
        )
      },
    })

    renderPage(ENDPOINT_ID)

    await userEvent.click(await waitFor(() => findMoreActionsButton()))
    fireEvent.click(await screen.findByText('Send test event'))

    await waitFor(() => expect(testCalled).toBe(true))
  })

  test('regenerates the signing secret and reveals the new value', async () => {
    mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
    mockDeliveriesList([])

    const requests: Array<{ body: EndpointUpdateRequestBody }> = []
    addAPIMock({
      method: 'patch',
      path: '/v2/projects/:ref/webhooks/endpoints/:id',
      response: async ({ request }) => {
        requests.push({ body: (await request.json()) as unknown as EndpointUpdateRequestBody })
        return HttpResponse.json<EndpointUpdateResponse>({
          data: { id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES },
        })
      },
    })

    renderPage(ENDPOINT_ID)

    await userEvent.click(await waitFor(() => findMoreActionsButton()))
    fireEvent.click(await screen.findByText('Regenerate secret'))
    fireEvent.click(await screen.findByRole('button', { name: 'Regenerate' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].body.data.attributes.signing_secret).toMatch(/^whsec_/)
    expect(await screen.findByRole('heading', { name: 'Signing secret' })).toBeInTheDocument()
    expect(
      await screen.findByDisplayValue(requests[0].body.data.attributes.signing_secret!)
    ).toBeInTheDocument()
  })

  test('retries a failed delivery', async () => {
    mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
    mockDeliveriesList([{ id: DELIVERY_ID, type: 'delivery', attributes: DELIVERY_ATTRIBUTES }])

    let retryCalled = false
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/webhooks/deliveries/:id/retry',
      response: ({ params }) => {
        expect(params.id).toBe(DELIVERY_ID)
        retryCalled = true
        return HttpResponse.json<DeliveryRetryResponse>({
          data: { id: 'evt_1', type: 'ingress' },
        })
      },
    })

    renderPage(ENDPOINT_ID)

    fireEvent.click(await screen.findByLabelText(`Retry ${DELIVERY_ID}`))

    await waitFor(() => expect(retryCalled).toBe(true))
  })

  test('shows a friendly message when retry hits the rate limit', async () => {
    mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
    mockDeliveriesList([{ id: DELIVERY_ID, type: 'delivery', attributes: DELIVERY_ATTRIBUTES }])

    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/webhooks/deliveries/:id/retry',
      response: () =>
        // The real API nests the error under `error` with no top-level `message`,
        // unlike the `APIErrorBody` shape `addAPIMock` expects for errors.
        HttpResponse.json<APIErrorBody>(
          {
            error: { code: 'too_many_requests', message: 'Too Many Requests' },
          } as unknown as APIErrorBody,
          { status: 429 }
        ),
    })

    renderPage(ENDPOINT_ID)

    fireEvent.click(await screen.findByLabelText(`Retry ${DELIVERY_ID}`))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/wait a minute and try again \(limit: 10 per minute\)/i)
      )
    )
  })
})
