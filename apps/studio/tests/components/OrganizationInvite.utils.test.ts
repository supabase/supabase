import { describe, expect, test } from 'vitest'

import {
  getOrganizationInviteContent,
  getOrganizationInviteStatus,
  type OrganizationInviteStatus,
} from '@/components/interfaces/OrganizationInvite/OrganizationInvite.utils'
import type { OrganizationInviteByToken } from '@/data/organization-members/organization-invitation-token-query'
import type { ResponseError } from '@/types'

const READY_INVITE: OrganizationInviteByToken = {
  authorized_user: true,
  email_match: true,
  expired_token: false,
  invite_id: 42,
  organization_name: 'Acme Corp',
  sso_mismatch: false,
  token_does_not_exist: false,
}

const responseError = (message: string, code = 500) => ({ message, code }) as ResponseError
type StatusOverrides = Partial<Parameters<typeof getOrganizationInviteStatus>[0]>

const getStatus = (overrides: StatusOverrides = {}) =>
  getOrganizationInviteStatus({
    data: READY_INVITE,
    error: null,
    isErrorInvitation: false,
    isLoadingInvitation: false,
    isLoadingProfile: false,
    isLoggedIn: true,
    isRouterReady: true,
    isSuccessInvitation: true,
    profileExists: true,
    ...overrides,
  })

describe('OrganizationInvite utils', () => {
  test.each<[string, OrganizationInviteStatus, StatusOverrides]>([
    ['signed out when there is no current user', 'signed-out', { isLoggedIn: false }],
    ['loading while the profile is loading', 'loading', { isLoadingProfile: true }],
    ['loading while the invite is loading', 'loading', { isLoadingInvitation: true }],
    [
      'no longer valid for accepted or declined invites',
      'no-longer-valid',
      {
        data: undefined,
        error: responseError('Failed to retrieve organization', 401),
        isErrorInvitation: true,
        isSuccessInvitation: false,
      },
    ],
    [
      'invalid when the API returns a missing token response',
      'invalid',
      {
        data: { ...READY_INVITE, token_does_not_exist: true },
      },
    ],
    [
      'invalid when the invite lookup 404s',
      'invalid',
      {
        data: undefined,
        error: responseError('Not Found', 404),
        isErrorInvitation: true,
        isSuccessInvitation: false,
      },
    ],
    [
      'error for other API failures',
      'error',
      {
        data: undefined,
        error: responseError('Failed to retrieve token', 500),
        isErrorInvitation: true,
        isSuccessInvitation: false,
      },
    ],
    [
      'expired when the token has expired',
      'expired',
      {
        data: { ...READY_INVITE, expired_token: true },
      },
    ],
    [
      'wrong account when the invite email does not match',
      'wrong-account',
      {
        data: { ...READY_INVITE, email_match: false },
      },
    ],
    ['ready when the invite can be accepted', 'ready', {}],
  ])('returns %s', (_name, expected, overrides) => {
    expect(getStatus(overrides)).toBe(expected)
  })

  test.each<[OrganizationInviteStatus, string, string | undefined]>([
    ['signed-out', 'View invitation', 'Sign in or create an account to view this invitation'],
    ['ready', 'Join Acme Corp', 'You have been invited to join this Supabase organization'],
    ['wrong-account', 'Wrong account', undefined],
    ['expired', 'Invite expired', undefined],
    ['invalid', 'Invite invalid', undefined],
    ['no-longer-valid', 'Invite no longer available', undefined],
    ['error', 'Unable to load invitation', undefined],
  ])('returns content for %s', (status, title, description) => {
    expect(
      getOrganizationInviteContent({
        data: READY_INVITE,
        isSignUpEnabled: true,
        status,
      })
    ).toEqual({ title, ...(description ? { description } : {}) })
  })

  test('omits sign-up copy when sign-up is disabled', () => {
    expect(
      getOrganizationInviteContent({
        data: READY_INVITE,
        isSignUpEnabled: false,
        status: 'signed-out',
      }).description
    ).toBe('Sign in to view this invitation')
  })
})
