import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { apiV1Components as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast, Toaster } from 'sonner'
import { beforeEach, describe, expect, test } from 'vitest'

import { NetworkRestrictionsReview } from './NetworkRestrictionsReview'
import { useNetworkRestrictionsQuery } from '@/data/network-restrictions/network-restrictions-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

mockAnimationsApi()

type NetworkRestrictionsResponse = components['schemas']['NetworkRestrictionsResponse_Output']

const REQUESTED_AT = '2026-01-01T00:00:00+00:00'

const restrictionsResponse: NetworkRestrictionsResponse = {
  entitlement: 'allowed',
  status: 'stored',
  config: { dbAllowedCidrs: [], dbAllowedCidrsV6: [] },
}

const mockReview = () => {
  const bodies: unknown[] = []
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/network-restrictions/review',
    response: async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json<NetworkRestrictionsResponse>(restrictionsResponse)
    },
  })
  return bodies
}

const mockApply = () => {
  const bodies: unknown[] = []
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/network-restrictions/apply',
    response: async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json<NetworkRestrictionsResponse>(restrictionsResponse, { status: 201 })
    },
  })
  return bodies
}

// Like NetworkRestrictions, shows the review only while the API reports a change in review
const ReviewWhilePending = () => {
  const { data } = useNetworkRestrictionsQuery({ projectRef: 'default' })
  if (data?.pending_config === undefined || data.pending_requested_at === undefined) return null
  return (
    <NetworkRestrictionsReview
      projectRef="default"
      enforced={{ ipv4: data.config.dbAllowedCidrs ?? [], ipv6: [] }}
      pending={{ ipv4: data.pending_config.dbAllowedCidrs ?? [], ipv6: [] }}
      requestedAt={data.pending_requested_at}
    />
  )
}

const renderReview = (pendingIpv4: string[]) =>
  customRender(
    <NetworkRestrictionsReview
      projectRef="default"
      enforced={{ ipv4: ['198.51.100.0/24', '203.0.113.0/24'], ipv6: [] }}
      pending={{ ipv4: pendingIpv4, ipv6: [] }}
      requestedAt={REQUESTED_AT}
    />
  )

describe('NetworkRestrictionsReview', () => {
  beforeEach(() => {
    mockProjectGrantContext({ ref: 'default' })
    // Toasts outlive a test, and a Toaster shows those still active when it mounts
    toast.dismiss()
  })

  test('marks the entries the change adds and removes', async () => {
    renderReview(['203.0.113.0/24', '192.0.2.0/24'])

    expect((await screen.findByText('192.0.2.0/24')).parentElement).toHaveTextContent('Adding')
    expect(screen.getByText('198.51.100.0/24').parentElement).toHaveTextContent('Removing')
    expect(screen.getByText('203.0.113.0/24').parentElement).not.toHaveTextContent(
      /Adding|Removing/
    )
  })

  test('applies the change on screen through the review endpoint', async () => {
    const bodies = mockReview()
    renderReview(['192.0.2.0/24'])

    fireEvent.click(await screen.findByRole('button', { name: 'Apply change' }))

    await waitFor(() => expect(bodies).toEqual([{ action: 'apply', requested_at: REQUESTED_AT }]))
  })

  test('asks for confirmation before discarding the change', async () => {
    const bodies = mockReview()
    renderReview(['192.0.2.0/24'])

    fireEvent.click(await screen.findByRole('button', { name: 'Discard change' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('The pending list will be deleted')
    expect(bodies).toEqual([])

    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard change' }))

    await waitFor(() => expect(bodies).toEqual([{ action: 'reject', requested_at: REQUESTED_AT }]))
  })

  test('saves a corrected list when the change has an entry that is not a valid range', async () => {
    const bodies = mockApply()
    renderReview(['1.209.170.63/25'])

    expect(await screen.findByText('Invalid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Apply corrected change' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('1.209.170.63/25 → 1.209.170.0/25')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply corrected change' }))

    await waitFor(() =>
      expect(bodies).toEqual([{ dbAllowedCidrs: ['1.209.170.0/25'], dbAllowedCidrsV6: [] }])
    )
  })

  test('explains why an entry is invalid from the info button next to it', async () => {
    renderReview(['1.209.170.63/25'])

    const info = await screen.findByRole('button', { name: 'Why 1.209.170.63/25 is invalid' })
    act(() => info.focus())

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      "The address isn't the start of its range. Did you mean 1.209.170.0/25?"
    )
  })

  test.each([
    {
      pendingIpv4: ['192.0.2.0/24'],
      path: '/v1/projects/:ref/network-restrictions/review' as const,
      button: 'Apply change',
      message: 'Applying network restrictions change',
    },
    {
      pendingIpv4: ['1.209.170.63/25'],
      path: '/v1/projects/:ref/network-restrictions/apply' as const,
      button: 'Apply corrected change',
      message: 'Network restrictions change applied',
    },
  ])(
    'confirms "$button" after the change leaves review',
    async ({ pendingIpv4, path, button, message }) => {
      let isPending = true
      addAPIMock({
        method: 'get',
        path: '/v1/projects/:ref/network-restrictions',
        response: () =>
          HttpResponse.json<NetworkRestrictionsResponse>(
            isPending
              ? {
                  ...restrictionsResponse,
                  pending_config: { dbAllowedCidrs: pendingIpv4, dbAllowedCidrsV6: [] },
                  pending_requested_at: REQUESTED_AT,
                }
              : restrictionsResponse
          ),
      })
      addAPIMock({
        method: 'post',
        path,
        response: () => {
          isPending = false
          return HttpResponse.json<NetworkRestrictionsResponse>(restrictionsResponse)
        },
      })
      customRender(
        <>
          <ReviewWhilePending />
          <Toaster />
        </>
      )

      fireEvent.click(await screen.findByRole('button', { name: button }))
      const dialog = screen.queryByRole('dialog')
      if (dialog !== null) fireEvent.click(within(dialog).getByRole('button', { name: button }))

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: button })).not.toBeInTheDocument()
      )
      expect(await screen.findByText(message)).toBeInTheDocument()
    }
  )

  test('blocks applying a change with no valid entries', async () => {
    renderReview(['not-an-address/32'])

    expect(await screen.findByRole('button', { name: 'Apply corrected change' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
