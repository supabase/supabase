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
    await userEvent.click(urlInput)
    await userEvent.paste('https://hooks.example.com/project')
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
    await userEvent.paste(updatedUrl)
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

  describe('deliveries errors', () => {
    test('shows an error when the first deliveries load fails', async () => {
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: () =>
          HttpResponse.json<APIErrorBody>({ message: 'Something went wrong' }, { status: 500 }),
      })

      renderPage(ENDPOINT_ID)

      expect(await screen.findByText('Failed to retrieve deliveries')).toBeInTheDocument()
      expect(screen.queryByText('No deliveries found')).not.toBeInTheDocument()
    })

    test('shows the error when the first load was empty and a refresh fails', async () => {
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      let requests = 0
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: () => {
          requests += 1
          // The first load is empty, the refresh after it fails
          if (requests > 1) {
            return HttpResponse.json<APIErrorBody>(
              { message: 'Something went wrong' },
              { status: 500 }
            )
          }
          return HttpResponse.json<DeliveryListResponse>({
            data: [],
            links: { first: null, last: null, next: null, prev: null },
          })
        },
      })

      renderPage(ENDPOINT_ID)
      await screen.findByText('No deliveries found')

      await userEvent.setup().click(screen.getByRole('button', { name: 'Refresh deliveries' }))

      expect(await screen.findByText('Failed to retrieve deliveries')).toBeInTheDocument()
    })

    test('"Try again" loads the rows after a failed first load', async () => {
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      let requests = 0
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: () => {
          requests += 1
          // Only the first request fails, so the next one has to come from the button
          if (requests === 1) {
            return HttpResponse.json<APIErrorBody>(
              { message: 'Something went wrong' },
              { status: 500 }
            )
          }
          return HttpResponse.json<DeliveryListResponse>({
            data: [{ id: DELIVERY_ID, type: 'delivery', attributes: DELIVERY_ATTRIBUTES }],
            links: { first: null, last: null, next: null, prev: null },
          })
        },
      })

      renderPage(ENDPOINT_ID)
      await screen.findByText('Failed to retrieve deliveries')

      await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))

      expect(await screen.findByLabelText(`Retry ${DELIVERY_ID}`)).toBeInTheDocument()
      expect(screen.queryByText('Failed to retrieve deliveries')).not.toBeInTheDocument()
    })

    test('keeps the rows and warns they may be out of date when a refresh fails', async () => {
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      let requests = 0
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: () => {
          requests += 1
          // The first load works, the refresh after it fails
          if (requests > 1) {
            return HttpResponse.json<APIErrorBody>(
              { message: 'Something went wrong' },
              { status: 500 }
            )
          }
          return HttpResponse.json<DeliveryListResponse>({
            data: [{ id: DELIVERY_ID, type: 'delivery', attributes: DELIVERY_ATTRIBUTES }],
            links: { first: null, last: null, next: null, prev: null },
          })
        },
      })

      renderPage(ENDPOINT_ID)
      await screen.findByLabelText(`Retry ${DELIVERY_ID}`)

      await userEvent.setup().click(screen.getByRole('button', { name: 'Refresh deliveries' }))

      expect(await screen.findByText('Unable to refresh deliveries')).toBeInTheDocument()
      expect(screen.getByLabelText(`Retry ${DELIVERY_ID}`)).toBeInTheDocument()
      expect(screen.queryByText('Failed to retrieve deliveries')).not.toBeInTheDocument()
    })

    test('shows the search empty state, not an error, when a refresh fails after rows loaded', async () => {
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      let requests = 0
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: () => {
          requests += 1
          // The first load works, the refresh after it fails
          if (requests > 1) {
            return HttpResponse.json<APIErrorBody>(
              { message: 'Something went wrong' },
              { status: 500 }
            )
          }
          return HttpResponse.json<DeliveryListResponse>({
            data: [{ id: DELIVERY_ID, type: 'delivery', attributes: DELIVERY_ATTRIBUTES }],
            links: { first: null, last: null, next: null, prev: null },
          })
        },
      })

      renderPage(ENDPOINT_ID)
      await screen.findByLabelText(`Retry ${DELIVERY_ID}`)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Refresh deliveries' }))
      await waitFor(() => expect(requests).toBeGreaterThan(1))

      await user.type(screen.getByPlaceholderText('Search deliveries'), 'no match')

      expect(await screen.findByText('No deliveries found')).toBeInTheDocument()
      expect(screen.queryByText('Failed to retrieve deliveries')).not.toBeInTheDocument()
    })
  })

  describe('deliveries refreshing', () => {
    const mockDeliveries = (getRows: (requests: number) => DeliveryResource[]) => {
      let requests = 0
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: () => {
          requests += 1
          return HttpResponse.json<DeliveryListResponse>({
            data: getRows(requests),
            links: { first: null, last: null, next: null, prev: null },
          })
        },
      })
      return { getRequests: () => requests }
    }
    const delivery = (status: DeliveryResource['attributes']['status']): DeliveryResource => ({
      id: DELIVERY_ID,
      type: 'delivery',
      attributes: { ...DELIVERY_ATTRIBUTES, status },
    })

    test('does not poll by default', async () => {
      const { getRequests } = mockDeliveries(() => [delivery('success')])

      renderPage(ENDPOINT_ID)
      await screen.findByText('success')

      // Longer than the 5s polling interval
      await new Promise((resolve) => setTimeout(resolve, 5500))
      expect(getRequests()).toBe(1)
    }, 20000)

    test('refreshes once when Refresh is clicked', async () => {
      const { getRequests } = mockDeliveries(() => [delivery('success')])

      renderPage(ENDPOINT_ID)
      await screen.findByText('success')

      await userEvent.setup().click(screen.getByRole('button', { name: 'Refresh deliveries' }))

      await waitFor(() => expect(getRequests()).toBe(2))
    })

    test('polls while Live is on and stops when it is turned off', async () => {
      const { getRequests } = mockDeliveries(() => [delivery('success')])
      const user = userEvent.setup()

      renderPage(ENDPOINT_ID)
      await screen.findByText('success')

      const liveButton = screen.getByRole('button', { name: 'Live' })
      await user.click(liveButton)
      expect(liveButton).toHaveAttribute('aria-pressed', 'true')
      await waitFor(() => expect(getRequests()).toBeGreaterThan(1), { timeout: 9000 })

      await user.click(liveButton)
      expect(liveButton).toHaveAttribute('aria-pressed', 'false')
    }, 20000)

    test('polls while a delivery is pending, until it finishes', async () => {
      mockDeliveries((requests) => [delivery(requests === 1 ? 'pending' : 'success')])

      renderPage(ENDPOINT_ID)
      await screen.findByText('pending')

      expect(await screen.findByText('success', {}, { timeout: 9000 })).toBeInTheDocument()
    }, 20000)

    test('Live keeps working after a failed first load', async () => {
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      let requests = 0
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: () => {
          requests += 1
          // Only the first request fails, so the rows can only come from polling
          if (requests === 1) {
            return HttpResponse.json<APIErrorBody>(
              { message: 'Something went wrong' },
              { status: 500 }
            )
          }
          return HttpResponse.json<DeliveryListResponse>({
            data: [delivery('success')],
            links: { first: null, last: null, next: null, prev: null },
          })
        },
      })

      renderPage(ENDPOINT_ID)
      await screen.findByText('Failed to retrieve deliveries')

      await userEvent.setup().click(screen.getByRole('button', { name: 'Live' }))

      expect(await screen.findByText('success', {}, { timeout: 9000 })).toBeInTheDocument()
      expect(screen.queryByText('Failed to retrieve deliveries')).not.toBeInTheDocument()
    }, 20000)

    test('polls after a test event is sent, until its delivery appears', async () => {
      // The first requests show no rows, as if the test event had not been delivered yet
      mockDeliveries((requests) => (requests < 3 ? [] : [delivery('success')]))
      addAPIMock({
        method: 'post',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/test',
        response: () =>
          HttpResponse.json<EndpointTestResponse>(
            { data: { id: 'evt_1', type: 'ingress' } },
            { status: 201 }
          ),
      })

      renderPage(ENDPOINT_ID)
      await screen.findByText('No deliveries found')

      await userEvent.click(await waitFor(() => findMoreActionsButton()))
      fireEvent.click(await screen.findByText('Send test event'))

      expect(await screen.findByText('success', {}, { timeout: 12000 })).toBeInTheDocument()
    }, 25000)
  })

  describe('deliveries pagination', () => {
    const mockPagedDeliveries = (ids: string[]) => {
      const requests: Array<{ size: string | null; after: string | null }> = []
      mockEndpointsList([{ id: ENDPOINT_ID, type: 'endpoint', attributes: ENDPOINT_ATTRIBUTES }])
      addAPIMock({
        method: 'get',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/deliveries',
        response: ({ request }) => {
          const url = new URL(request.url)
          const size = url.searchParams.get('page[size]')
          const after = url.searchParams.get('page[after]')
          requests.push({ size, after })

          // Same rules as the real API: newest first, and the cursor row itself is skipped.
          const rows = ids
            .filter((id) => after === null || id < after)
            .slice(0, Number(size))
            .map((id) => ({
              id,
              type: 'delivery' as const,
              attributes: { ...DELIVERY_ATTRIBUTES, id },
            }))
          return HttpResponse.json<DeliveryListResponse>({
            data: rows,
            links: { first: null, last: null, next: null, prev: null },
          })
        },
      })
      return requests
    }

    test('pages forward and back, asking for one extra row to detect a next page', async () => {
      const requests = mockPagedDeliveries([7, 6, 5, 4, 3, 2, 1].map((n) => `delivery-${n}`))
      renderPage(ENDPOINT_ID)

      expect(await screen.findByLabelText('Retry delivery-7')).toBeInTheDocument()
      expect(screen.getByLabelText('Retry delivery-3')).toBeInTheDocument()
      expect(screen.queryByLabelText('Retry delivery-2')).not.toBeInTheDocument()
      expect(requests[0]).toEqual({ size: '6', after: null })
      expect(screen.getByLabelText('Previous page')).toBeDisabled()
      expect(screen.getByLabelText('Next page')).toBeEnabled()

      fireEvent.click(screen.getByLabelText('Next page'))

      expect(await screen.findByLabelText('Retry delivery-2')).toBeInTheDocument()
      expect(screen.queryByLabelText('Retry delivery-7')).not.toBeInTheDocument()
      expect(requests).toContainEqual({ size: '6', after: 'delivery-3' })
      expect(screen.getByLabelText('Next page')).toBeDisabled()
      expect(screen.getByLabelText('Previous page')).toBeEnabled()

      fireEvent.click(screen.getByLabelText('Previous page'))

      expect(await screen.findByLabelText('Retry delivery-7')).toBeInTheDocument()
      expect(screen.getByLabelText('Retry delivery-3')).toBeInTheDocument()
      expect(screen.getByLabelText('Previous page')).toBeDisabled()
    })

    test('disables both buttons when the deliveries exactly fill one page', async () => {
      mockPagedDeliveries([5, 4, 3, 2, 1].map((n) => `delivery-${n}`))
      renderPage(ENDPOINT_ID)

      expect(await screen.findByLabelText('Retry delivery-1')).toBeInTheDocument()
      expect(screen.getByLabelText('Previous page')).toBeDisabled()
      expect(screen.getByLabelText('Next page')).toBeDisabled()
    })

    test('goes back to the first page after a test event, where its delivery will appear', async () => {
      const requests = mockPagedDeliveries([7, 6, 5, 4, 3, 2, 1].map((n) => `delivery-${n}`))
      addAPIMock({
        method: 'post',
        path: '/v2/projects/:ref/webhooks/endpoints/:id/test',
        response: () =>
          HttpResponse.json<EndpointTestResponse>(
            { data: { id: 'evt_1', type: 'ingress' } },
            { status: 201 }
          ),
      })
      renderPage(ENDPOINT_ID)

      await screen.findByLabelText('Retry delivery-7')
      fireEvent.click(screen.getByLabelText('Next page'))
      await screen.findByLabelText('Retry delivery-2')
      expect(screen.getByLabelText('Previous page')).toBeEnabled()

      await userEvent.click(await waitFor(() => findMoreActionsButton()))
      fireEvent.click(await screen.findByText('Send test event'))

      expect(await screen.findByLabelText('Retry delivery-7')).toBeInTheDocument()
      expect(screen.queryByLabelText('Retry delivery-2')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Previous page')).toBeDisabled()
      expect(requests.at(-1)).toEqual({ size: '6', after: null })
    })
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
