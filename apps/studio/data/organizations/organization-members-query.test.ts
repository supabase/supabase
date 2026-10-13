import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getOrganizationMembers } from './organization-members-query'
import type { components } from '@/data/api'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type Member = components['schemas']['Member_Output']
type InvitationResponse = components['schemas']['InvitationResponse_Output']

const member: Member = {
  avatar_url: null,
  gotrue_id: 'gotrue-id',
  is_sso_user: false,
  metadata: {},
  mfa_enabled: false,
  primary_email: 'member@example.com',
  role_ids: [1],
  username: 'member',
}

describe('getOrganizationMembers', () => {
  it('merges members with pending invitations', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members',
      response: [member],
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members/invitations',
      response: {
        invitations: [
          {
            id: 1,
            invited_at: '2026-01-01T00:00:00Z',
            invited_email: 'invitee@example.com',
            role_id: 2,
          },
        ],
      } satisfies InvitationResponse,
    })

    const result = await getOrganizationMembers({ slug: 'org-slug' })

    expect(result).toEqual([
      member,
      {
        invited_at: '2026-01-01T00:00:00Z',
        invited_id: 1,
        mfa_enabled: false,
        username: 'i',
        primary_email: 'invitee@example.com',
        role_ids: [2],
      },
    ])
  })

  it('treats a 403 on invitations as no visible invitations, instead of failing the members list', async () => {
    // Project-scoped members are not permitted to read org invitations
    // The members list itself must still load.
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members',
      response: [member],
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members/invitations',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Forbidden' }, { status: 403 }),
    })

    const result = await getOrganizationMembers({ slug: 'org-slug' })

    expect(result).toEqual([member])
  })

  it('rethrows a non-403 error on the invitations call', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members',
      response: [member],
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members/invitations',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Internal Server Error' }, { status: 500 }),
    })

    await expect(getOrganizationMembers({ slug: 'org-slug' })).rejects.toThrowError(
      'Internal Server Error'
    )
  })

  it('rethrows an error on the members call even if invitations succeed', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Forbidden' }, { status: 403 }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/members/invitations',
      response: { invitations: [] } satisfies InvitationResponse,
    })

    await expect(getOrganizationMembers({ slug: 'org-slug' })).rejects.toThrowError('Forbidden')
  })
})
