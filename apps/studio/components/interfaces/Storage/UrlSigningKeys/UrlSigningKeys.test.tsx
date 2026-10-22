import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { UrlSigningKeys } from './UrlSigningKeys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ListJwksResponse = components['schemas']['ListJwksResponse_Output']
type Jwk = ListJwksResponse['data'][number]

const mockTrack = vi.hoisted(() => vi.fn())
const mockPermissions = vi.hoisted(() => ({ can: true }))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))
vi.mock('@/hooks/misc/useCheckPermissions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/misc/useCheckPermissions')>()),
  useAsyncCheckPermissions: () => ({ can: mockPermissions.can, isLoading: false, isSuccess: true }),
}))
vi.mock('@/hooks/misc/useSelectedProject', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/misc/useSelectedProject')>()),
  useIsProjectActive: () => true,
}))

mockAnimationsApi()

const ACTIVE: Jwk = { kid: 'active-key', kind: 'storage-url-signing-key', type: 'EC', active: true }
const STANDBY: Jwk = {
  kid: 'standby-key',
  kind: 'storage-url-standby-key',
  type: 'oct',
  active: true,
}
const REVOKED: Jwk = {
  kid: 'revoked-key',
  kind: 'storage-url-standby-key',
  type: 'EC',
  active: false,
}

const mockKeys = (keys: Jwk[]) =>
  addAPIMock({
    method: 'get',
    path: '/platform/storage/:ref/jwks',
    response: () => HttpResponse.json<ListJwksResponse>({ data: keys }),
  })

const getRow = async (kid: string) => {
  const row = (await screen.findByText(kid)).closest('tr')
  if (!row) throw new Error(`No table row for key ${kid}`)
  return within(row)
}

describe('UrlSigningKeys', () => {
  beforeEach(() => {
    mockTrack.mockClear()
    mockPermissions.can = true
  })

  test('groups keys by role and labels their algorithms', async () => {
    mockKeys([ACTIVE, STANDBY, REVOKED])
    customRender(<UrlSigningKeys />)

    const active = await getRow('active-key')
    expect(active.getByText('Active')).toBeInTheDocument()
    expect(active.getByText('ES256 (ECC)')).toBeInTheDocument()

    const standby = await getRow('standby-key')
    expect(standby.getByText('Standby')).toBeInTheDocument()
    expect(standby.getByText('HS512 (Shared secret)')).toBeInTheDocument()

    const revoked = await getRow('revoked-key')
    expect(revoked.getByText('Revoked')).toBeInTheDocument()
  })

  test('shows no permission state without storage admin read access', async () => {
    mockPermissions.can = false
    customRender(<UrlSigningKeys />)

    expect(await screen.findByText(/need additional permissions/i)).toBeInTheDocument()
    expect(screen.queryByText('Active key')).not.toBeInTheDocument()
  })

  test('disables creating a standby key while one exists', async () => {
    mockKeys([ACTIVE, STANDBY])
    customRender(<UrlSigningKeys />)

    expect(await screen.findByRole('button', { name: 'Create standby key' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  test('creates an ES256 standby key by default and tracks it', async () => {
    mockKeys([ACTIVE])
    const bodies: unknown[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/jwks/url-signing/standby',
      response: async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ kid: 'new-key' }, { status: 201 })
      },
    })
    customRender(<UrlSigningKeys />)

    await userEvent.click(await screen.findByRole('button', { name: 'Create standby key' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create standby key' }))

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('storage_url_signing_key_created', {
        algorithm: 'ES256',
      })
    )
    expect(bodies).toEqual([{ type: 'ES256' }])
  })

  test('rotates the standby key to active and tracks it', async () => {
    mockKeys([ACTIVE, STANDBY])
    const swapped: Array<string | undefined> = []
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/jwks/url-signing/standby/:kid/swap',
      response: ({ params }) => {
        swapped.push(params.kid as string | undefined)
        return HttpResponse.json({}, { status: 201 })
      },
    })
    customRender(<UrlSigningKeys />)

    const standby = await getRow('standby-key')
    await userEvent.click(standby.getByRole('button', { name: 'Rotate key' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rotate key' }))

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('storage_url_signing_key_updated', {
        change: 'rotated',
      })
    )
    expect(swapped).toEqual(['standby-key'])
  })

  test('revokes a standby key once its ID is typed and tracks it', async () => {
    mockKeys([ACTIVE, STANDBY])
    const bodies: unknown[] = []
    addAPIMock({
      method: 'put',
      path: '/platform/storage/:ref/jwks/:kid',
      response: async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ result: true })
      },
    })
    customRender(<UrlSigningKeys />)

    const standby = await getRow('standby-key')
    await userEvent.click(standby.getByRole('button', { name: 'More options' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Revoke key' }))

    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Revoke key' })

    fireEvent.click(confirm)
    expect(await within(dialog).findByText(/Value entered does not match/i)).toBeInTheDocument()
    expect(bodies).toEqual([])

    await userEvent.type(
      within(dialog).getByPlaceholderText('Type the key ID to confirm'),
      'standby-key'
    )
    fireEvent.click(confirm)

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('storage_url_signing_key_updated', {
        change: 'revoked',
      })
    )
    expect(bodies).toEqual([{ active: false }])
  })

  test('moves a revoked key back to standby and tracks it', async () => {
    mockKeys([ACTIVE, REVOKED])
    const bodies: unknown[] = []
    addAPIMock({
      method: 'put',
      path: '/platform/storage/:ref/jwks/:kid',
      response: async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ result: true })
      },
    })
    customRender(<UrlSigningKeys />)

    const revoked = await getRow('revoked-key')
    await userEvent.click(revoked.getByRole('button', { name: 'More options' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move to standby key' }))

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('storage_url_signing_key_updated', {
        change: 'moved_to_standby',
      })
    )
    expect(bodies).toEqual([{ active: true }])
  })

  test('disables moving a revoked key to standby while a standby key exists', async () => {
    mockKeys([ACTIVE, STANDBY, REVOKED])
    customRender(<UrlSigningKeys />)

    const revoked = await getRow('revoked-key')
    await userEvent.click(revoked.getByRole('button', { name: 'More options' }))

    const item = await screen.findByRole('menuitem', { name: 'Move to standby key' })
    expect(item).toHaveAttribute('aria-disabled', 'true')
  })
})
