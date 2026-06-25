import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import type { TemporaryAccessGrantDraft } from './TemporaryAccess.types'
import { createEmptyGrant } from './TemporaryAccess.utils'
import {
  buildPendingInvitationAccessGrant,
  createInviteGuestGrantDraft,
  EXTERNAL_COLLABORATOR_ROLE_ID,
  isExternalCollaboratorRole,
  resolveExternalCollaboratorInviteRole,
  serializeInviteGrantsForPendingPayload,
  validateGuestAccessGrants,
} from './TemporaryAccessInvite.utils'

describe('TemporaryAccessInvite.utils', () => {
  test('isExternalCollaboratorRole identifies sentinel role id', () => {
    expect(isExternalCollaboratorRole(EXTERNAL_COLLABORATOR_ROLE_ID)).toBe(true)
    expect(isExternalCollaboratorRole('3')).toBe(false)
  })

  test('resolveExternalCollaboratorInviteRole prefers org Read-only', () => {
    expect(
      resolveExternalCollaboratorInviteRole({
        org_scoped_roles: [
          { id: 3, name: 'Developer', base_role_id: 3, description: null, projects: [] },
          { id: 4, name: 'Read-only', base_role_id: 4, description: null, projects: [] },
        ],
        project_scoped_roles: [],
      })
    ).toEqual({ roleId: 4, usesDeveloperFallback: false })
  })

  test('resolveExternalCollaboratorInviteRole falls back to Developer on Free-style orgs', () => {
    expect(
      resolveExternalCollaboratorInviteRole({
        org_scoped_roles: [
          { id: 3, name: 'Developer', base_role_id: 3, description: null, projects: [] },
        ],
        project_scoped_roles: [],
      })
    ).toEqual({ roleId: 3, usesDeveloperFallback: true })
  })

  test('resolveExternalCollaboratorInviteRole falls back to org Developer when org Read-only is absent', () => {
    expect(
      resolveExternalCollaboratorInviteRole({
        org_scoped_roles: [
          { id: 3, name: 'Developer', base_role_id: 3, description: null, projects: [] },
        ],
        project_scoped_roles: [
          { id: 104, name: 'Read-only', base_role_id: 4, description: null, projects: [] },
        ],
      })
    ).toEqual({ roleId: 3, usesDeveloperFallback: true })
  })

  test('createInviteGuestGrantDraft pre-enables read-only with 1h expiry', () => {
    const draft = createInviteGuestGrantDraft(['postgres', 'supabase_read_only_user'])
    const readOnly = draft.grants.find((grant) => grant.roleId === 'supabase_read_only_user')

    expect(readOnly?.enabled).toBe(true)
    expect(readOnly?.expiryMode).toBe('1h')
    expect(readOnly?.hasExpiry).toBe(true)
  })

  test('serializeInviteGrantsForPendingPayload uses expires_after_seconds for presets', () => {
    const draft: TemporaryAccessGrantDraft = {
      memberId: '',
      grants: [
        {
          ...createEmptyGrant('supabase_read_only_user'),
          enabled: true,
          hasExpiry: true,
          expiryMode: '1h',
          expiry: '',
        },
      ],
    }

    expect(serializeInviteGrantsForPendingPayload(draft)).toEqual([
      {
        role: 'supabase_read_only_user',
        expires_after_seconds: 60 * 60,
      },
    ])
  })

  test('serializeInviteGrantsForPendingPayload uses expires_at for custom picker', () => {
    const expiry = dayjs().add(2, 'day').toISOString()
    const draft: TemporaryAccessGrantDraft = {
      memberId: '',
      grants: [
        {
          ...createEmptyGrant('postgres'),
          enabled: true,
          hasExpiry: true,
          expiryMode: 'custom',
          expiry,
        },
      ],
    }

    const [role] = serializeInviteGrantsForPendingPayload(draft)
    expect(role?.expires_at).toBe(dayjs(expiry).unix())
    expect(role?.expires_after_seconds).toBeUndefined()
  })

  test('serializeInviteGrantsForPendingPayload includes IP restrictions', () => {
    const draft: TemporaryAccessGrantDraft = {
      memberId: '',
      grants: [
        {
          ...createEmptyGrant('supabase_read_only_user'),
          enabled: true,
          hasExpiry: true,
          expiryMode: '1d',
          expiry: '',
          ipRanges: [{ value: '192.168.0.0/24' }],
        },
      ],
    }

    expect(serializeInviteGrantsForPendingPayload(draft)[0]?.allowed_networks).toEqual({
      allowed_cidrs: [{ cidr: '192.168.0.0/24' }],
    })
  })

  test('validateGuestAccessGrants rejects never expiry for guests', () => {
    const draft: TemporaryAccessGrantDraft = {
      memberId: '',
      grants: [
        {
          ...createEmptyGrant('postgres'),
          enabled: true,
          expiryMode: 'never',
          hasExpiry: false,
          expiry: '',
        },
      ],
    }

    expect(validateGuestAccessGrants(draft.grants)).toMatch(/must have an expiry/i)
  })

  test('buildPendingInvitationAccessGrant assembles project and roles', () => {
    const grant = buildPendingInvitationAccessGrant('abcdefgh', {
      memberId: '',
      grants: [
        {
          ...createEmptyGrant('supabase_read_only_user'),
          enabled: true,
          hasExpiry: true,
          expiryMode: '7d',
          expiry: '',
        },
      ],
    })

    expect(grant.project_ref).toBe('abcdefgh')
    expect(grant.roles[0]).toEqual({
      role: 'supabase_read_only_user',
      expires_after_seconds: 60 * 60 * 24 * 7,
    })
  })
})
