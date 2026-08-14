import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Telemetry } from './telemetry'

const mocks = vi.hoisted(() => ({
  identify: vi.fn(),
  useUser: vi.fn(),
  useOrganizationsQuery: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    posthogClient: {
      identify: mocks.identify,
    },
    useUser: () => mocks.useUser(),
    PageTelemetry: () => null,
  }
})

vi.mock('ui-patterns/consent', () => ({
  useConsentToast: () => ({ hasAcceptedConsent: true }),
}))

vi.mock('@/data/organizations/organizations-query', () => ({
  useOrganizationsQuery: () => mocks.useOrganizationsQuery(),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: undefined }),
}))

vi.mock('@sentry/nextjs', () => ({
  setUser: (...args: unknown[]) => mocks.setUser(...args),
  setTag: (...args: unknown[]) => mocks.setTag(...args),
}))

const USER_ID = 'user-abc-123'
const CREATED_AT = '2026-05-14T22:30:00.000Z'

const orgs = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: i, slug: `org-${i}` }))

describe('Telemetry — posthog identify mirroring', () => {
  beforeEach(() => {
    mocks.identify.mockReset()
    mocks.useUser.mockReset()
    mocks.useOrganizationsQuery.mockReset()
    mocks.setUser.mockReset()
    mocks.setTag.mockReset()
  })

  it('fires identify with both org_count and signup_timestamp when user and orgs are loaded', async () => {
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: CREATED_AT })
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })

    render(<Telemetry />)

    await waitFor(() => {
      expect(mocks.identify).toHaveBeenCalledWith(USER_ID, {
        org_count: 1,
        signup_timestamp: CREATED_AT,
      })
    })
  })

  it('omits signup_timestamp when created_at is missing', async () => {
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: undefined })
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })

    render(<Telemetry />)

    await waitFor(() => {
      expect(mocks.identify).toHaveBeenCalledWith(USER_ID, { org_count: 1 })
    })
  })

  it('dedupes when nothing has changed', async () => {
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: CREATED_AT })
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })

    const { rerender } = render(<Telemetry />)
    await waitFor(() => expect(mocks.identify).toHaveBeenCalledTimes(1))

    rerender(<Telemetry />)
    rerender(<Telemetry />)

    // Still only one identify — same user, same orgCount, same signupTimestamp.
    expect(mocks.identify).toHaveBeenCalledTimes(1)
  })

  it('re-fires identify when created_at arrives after the first effect run (CodeRabbit regression)', async () => {
    // Initial render: user.id is set, but created_at is still undefined (e.g. partial session parse).
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: undefined })
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })

    const { rerender } = render(<Telemetry />)
    await waitFor(() => expect(mocks.identify).toHaveBeenCalledTimes(1))
    expect(mocks.identify).toHaveBeenLastCalledWith(USER_ID, { org_count: 1 })

    // created_at lands later. The dedup ref must track signupTimestamp,
    // and the effect deps must include user.created_at, or the second
    // identify gets silently skipped — which is exactly the race we shipped
    // the original fix to close.
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: CREATED_AT })
    rerender(<Telemetry />)

    await waitFor(() => expect(mocks.identify).toHaveBeenCalledTimes(2))
    expect(mocks.identify).toHaveBeenLastCalledWith(USER_ID, {
      org_count: 1,
      signup_timestamp: CREATED_AT,
    })
  })

  it('re-fires identify when org_count changes', async () => {
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: CREATED_AT })
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })

    const { rerender } = render(<Telemetry />)
    await waitFor(() => expect(mocks.identify).toHaveBeenCalledTimes(1))

    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(2) })
    rerender(<Telemetry />)

    await waitFor(() => expect(mocks.identify).toHaveBeenCalledTimes(2))
    expect(mocks.identify).toHaveBeenLastCalledWith(USER_ID, {
      org_count: 2,
      signup_timestamp: CREATED_AT,
    })
  })

  it('does not fire identify when user or orgs are missing', async () => {
    // user missing
    mocks.useUser.mockReturnValue(null)
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })
    const first = render(<Telemetry />)
    await new Promise((r) => setTimeout(r, 10))
    expect(mocks.identify).not.toHaveBeenCalled()
    first.unmount()

    // user present but orgs not loaded
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: CREATED_AT })
    mocks.useOrganizationsQuery.mockReturnValue({ data: undefined })
    render(<Telemetry />)
    await new Promise((r) => setTimeout(r, 10))
    expect(mocks.identify).not.toHaveBeenCalled()
  })
})

describe('Telemetry — Sentry user identification', () => {
  beforeEach(() => {
    mocks.identify.mockReset()
    mocks.useUser.mockReset()
    mocks.useOrganizationsQuery.mockReset()
    mocks.setUser.mockReset()
  })

  it('sets the raw (un-hashed) user id on Sentry', async () => {
    mocks.useUser.mockReturnValue({ id: USER_ID, created_at: CREATED_AT })
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })

    render(<Telemetry />)

    await waitFor(() => {
      expect(mocks.setUser).toHaveBeenCalledWith({ id: USER_ID })
    })
  })

  it('does not set a Sentry user when the user is not logged in', async () => {
    mocks.useUser.mockReturnValue(null)
    mocks.useOrganizationsQuery.mockReturnValue({ data: orgs(1) })

    render(<Telemetry />)
    await new Promise((r) => setTimeout(r, 10))
    expect(mocks.setUser).not.toHaveBeenCalled()
  })
})
