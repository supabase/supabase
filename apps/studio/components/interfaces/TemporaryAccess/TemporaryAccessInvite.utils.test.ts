import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import {
  buildPendingInvitationAccessGrant,
  EXTERNAL_COLLABORATOR_ROLE_ID,
  isExternalCollaboratorRole,
} from './TemporaryAccessInvite.utils'

describe('TemporaryAccessInvite.utils', () => {
  test('isExternalCollaboratorRole identifies sentinel role id', () => {
    expect(isExternalCollaboratorRole(EXTERNAL_COLLABORATOR_ROLE_ID)).toBe(true)
    expect(isExternalCollaboratorRole('3')).toBe(false)
  })

  test('buildPendingInvitationAccessGrant maps template and expiry', () => {
    const grant = buildPendingInvitationAccessGrant({
      projectRef: 'abcdefgh',
      postgresTemplate: 'read-only',
      expiry: '1h',
    })

    expect(grant.project_ref).toBe('abcdefgh')
    expect(grant.roles).toHaveLength(1)
    expect(grant.roles[0]?.role).toBe('supabase_read_only_user')
    expect(grant.roles[0]?.expires_at).toBeGreaterThan(dayjs().unix())
    expect(grant.roles[0]?.expires_at).toBeLessThanOrEqual(dayjs().add(1, 'hour').unix() + 5)
  })

  test('buildPendingInvitationAccessGrant maps developer template to postgres role', () => {
    const grant = buildPendingInvitationAccessGrant({
      projectRef: 'proj-ref',
      postgresTemplate: 'developer',
      expiry: '7d',
    })

    expect(grant.roles[0]?.role).toBe('postgres')
  })
})
