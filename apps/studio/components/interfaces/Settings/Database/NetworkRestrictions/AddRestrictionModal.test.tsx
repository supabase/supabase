import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiV1Components as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AddRestrictionModal } from './AddRestrictionModal'
import { networkRestrictionKeys } from '@/data/network-restrictions/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

mockAnimationsApi()

type NetworkRestrictionsResponse = components['schemas']['NetworkRestrictionsResponse_Output']

type ApplyRequest = { ref: string | undefined; body: unknown }

const mockExistingRestrictions = (dbAllowedCidrs: string[]) => {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/network-restrictions',
    response: () =>
      HttpResponse.json<NetworkRestrictionsResponse>({
        entitlement: 'allowed',
        status: 'applied',
        config: { dbAllowedCidrs, dbAllowedCidrsV6: [] },
      }),
  })
}

const mockApply = () => {
  const requests: ApplyRequest[] = []
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/network-restrictions/apply',
    response: async ({ request, params }) => {
      requests.push({ ref: params.ref as string | undefined, body: await request.json() })
      return HttpResponse.json<NetworkRestrictionsResponse>(
        {
          entitlement: 'allowed',
          status: 'stored',
          config: { dbAllowedCidrs: [], dbAllowedCidrsV6: [] },
        },
        { status: 201 }
      )
    },
  })
  return requests
}

const renderModal = (
  props: Partial<React.ComponentProps<typeof AddRestrictionModal>> = {},
  { cachedCidrs }: { cachedCidrs?: string[] } = {}
) => {
  const onClose = props.onClose ?? vi.fn()

  // Seeding the cache means existing restrictions are available on first render,
  // so tests that depend on them don't have to wait for the query to resolve
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  if (cachedCidrs) {
    queryClient.setQueryData(networkRestrictionKeys.list('default'), {
      config: { dbAllowedCidrs: cachedCidrs, dbAllowedCidrsV6: [] },
    })
  }

  customRender(
    <AddRestrictionModal
      type="IPv4"
      hasOverachingRestriction={false}
      {...props}
      onClose={onClose}
    />,
    { queryClient }
  )
  return { onClose }
}

const user = userEvent.setup()

// Pasting rather than typing: keystroke-level input isn't the behaviour under test
const enterValue = async (input: HTMLElement, value: string) => {
  await user.clear(input)
  await user.paste(value)
}

const enterAddress = async (address: string) =>
  enterValue(await screen.findByPlaceholderText('0.0.0.0'), address)

const addEntry = async (address: string, cidrBlockSize?: string) => {
  await enterAddress(address)
  if (cidrBlockSize !== undefined) {
    await enterValue(screen.getByPlaceholderText('32'), cidrBlockSize)
  }
  fireEvent.click(screen.getByRole('button', { name: 'Add to list' }))
}

describe('AddRestrictionModal', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear()
  })

  test('disables Save until an address is entered', async () => {
    mockExistingRestrictions([])
    renderModal()

    expect(await screen.findByRole('button', { name: 'Save restrictions' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add to list' })).toBeDisabled()
  })

  test('moves an added address to the list and clears the fields', async () => {
    mockExistingRestrictions([])
    renderModal()

    await addEntry('203.0.113.7')

    expect(await screen.findByText('1 range to add')).toBeInTheDocument()
    expect(screen.getByDisplayValue('203.0.113.7/32')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.0.0.0')).toHaveValue('')
  })

  test('saves every added address in a single request, appended to existing ones', async () => {
    mockExistingRestrictions(['198.51.100.0/24'])
    const requests = mockApply()
    const { onClose } = renderModal({}, { cachedCidrs: ['198.51.100.0/24'] })

    await addEntry('203.0.113.7')
    await addEntry('192.0.2.0', '24')
    expect(await screen.findByText('2 ranges to add')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save restrictions' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(requests).toEqual([
      {
        ref: 'default',
        body: {
          dbAllowedCidrs: ['198.51.100.0/24', '203.0.113.7/32', '192.0.2.0/24'],
          dbAllowedCidrsV6: [],
        },
      },
    ])
  })

  test('includes a valid address that was typed but not added to the list', async () => {
    mockExistingRestrictions([])
    const requests = mockApply()
    const { onClose } = renderModal()

    await addEntry('203.0.113.7')
    await enterAddress('192.0.2.1')

    fireEvent.click(await screen.findByRole('button', { name: 'Save restrictions' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(requests).toHaveLength(1)
    expect(requests[0].body).toEqual({
      dbAllowedCidrs: ['203.0.113.7/32', '192.0.2.1/32'],
      dbAllowedCidrsV6: [],
    })
    expect(toast.success).toHaveBeenCalledWith('Restrictions added')
  })

  test('confirms a single restriction when only a typed address is saved', async () => {
    mockExistingRestrictions([])
    const requests = mockApply()
    const { onClose } = renderModal()

    await enterAddress('192.0.2.1')
    fireEvent.click(await screen.findByRole('button', { name: 'Save restriction' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(requests).toHaveLength(1)
    expect(toast.success).toHaveBeenCalledWith('Restriction added')
  })

  test('replaces an allow-all restriction instead of appending to it', async () => {
    mockExistingRestrictions(['0.0.0.0/0'])
    const requests = mockApply()
    const { onClose } = renderModal({ hasOverachingRestriction: true })

    await addEntry('203.0.113.7')
    fireEvent.click(await screen.findByRole('button', { name: 'Save restriction' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(requests[0].body).toEqual({ dbAllowedCidrs: ['203.0.113.7/32'], dbAllowedCidrsV6: [] })
  })

  test('rejects an address that is already restricted', async () => {
    mockExistingRestrictions(['203.0.113.7/32'])
    renderModal({}, { cachedCidrs: ['203.0.113.7/32'] })

    await addEntry('203.0.113.7')

    expect(
      await screen.findByText('The address 203.0.113.7/32 is already restricted')
    ).toBeInTheDocument()
    expect(screen.queryByText('1 range to add')).not.toBeInTheDocument()
  })

  test('rejects an address that is already in the list', async () => {
    mockExistingRestrictions([])
    renderModal()

    await addEntry('203.0.113.7')
    await addEntry('203.0.113.7')

    expect(
      await screen.findByText('The address 203.0.113.7/32 is already in the list')
    ).toBeInTheDocument()
    expect(screen.getByText('1 range to add')).toBeInTheDocument()
  })

  test('rejects private addresses', async () => {
    mockExistingRestrictions([])
    renderModal()

    await addEntry('10.0.0.1')

    expect(await screen.findByText('Private IP addresses are not supported')).toBeInTheDocument()
    expect(screen.queryByText('1 range to add')).not.toBeInTheDocument()
  })

  test('removes an address from the list', async () => {
    mockExistingRestrictions([])
    renderModal()

    await addEntry('203.0.113.7')
    await user.click(await screen.findByRole('button', { name: 'Remove 203.0.113.7/32' }))

    expect(screen.queryByDisplayValue('203.0.113.7/32')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save restrictions' })).toBeDisabled()
  })

  test('asks for confirmation before discarding added addresses', async () => {
    mockExistingRestrictions([])
    const { onClose } = renderModal()

    await addEntry('203.0.113.7')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('closes without confirmation when nothing was entered', async () => {
    mockExistingRestrictions([])
    const { onClose } = renderModal()

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalled()
  })
})
