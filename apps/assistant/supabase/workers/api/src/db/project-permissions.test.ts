import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ASSISTANT_CONSENT_VERSION, projectPermissionLevelSchema } from '../permissions'
import { adminQuery } from './postgres'
import { getProjectPermissions, setProjectPermissions } from './project-permissions'

vi.mock('./postgres', () => ({ adminQuery: vi.fn() }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(adminQuery).mockResolvedValue([])
})
describe('Assistant-owned project consent', () => {
  it('defaults to no consent and no data sharing without importing legacy settings', async () => {
    expect(await getProjectPermissions('user', 'project', 'org', true)).toEqual({
      level: 'disabled',
      hasConsented: false,
      canShareProjectData: true,
      consentVersion: ASSISTANT_CONSENT_VERSION,
    })
    expect(adminQuery).toHaveBeenCalledWith(
      expect.stringContaining('user_id=$1 and project_ref=$2 and org_slug=$3'),
      ['user', 'project', 'org']
    )
  })
  it.each(projectPermissionLevelSchema.options)(
    'uses fresh, explicitly granted %s consent',
    async (level) => {
      vi.mocked(adminQuery).mockResolvedValue([
        { level, consent_version: ASSISTANT_CONSENT_VERSION },
      ])
      expect(await getProjectPermissions('user', 'project', 'org', true)).toMatchObject({
        level,
        hasConsented: true,
      })
    }
  )
  it('fails closed on an obsolete grant or a newly restricted project', async () => {
    vi.mocked(adminQuery).mockResolvedValueOnce([
      { level: 'schema_and_log_and_data', consent_version: 0 },
    ])
    expect(await getProjectPermissions('user', 'project', 'org', true)).toMatchObject({
      level: 'disabled',
      hasConsented: false,
    })
    vi.mocked(adminQuery).mockResolvedValueOnce([
      { level: 'schema_and_log_and_data', consent_version: ASSISTANT_CONSENT_VERSION },
    ])
    expect(await getProjectPermissions('user', 'project', 'org', false)).toMatchObject({
      level: 'disabled',
    })
  })
  it('writes only the selected user/project grant and current consent version', async () => {
    await setProjectPermissions('user', 'project', 'org', 'schema')
    expect(adminQuery).toHaveBeenCalledWith(
      expect.stringContaining('on conflict (user_id,project_ref)'),
      ['user', 'project', 'org', 'schema', ASSISTANT_CONSENT_VERSION]
    )
  })
})
