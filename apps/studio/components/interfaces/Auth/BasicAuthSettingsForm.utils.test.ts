import { describe, expect, it } from 'vitest'

import { getBasicAuthGitHubConfigStates } from './BasicAuthSettingsForm.utils'
import type { ProjectAuthConfigData } from '@/data/auth/auth-config-query'

describe('getBasicAuthGitHubConfigStates', () => {
  it('compares persisted API values using config.toml semantics', () => {
    const authConfig = {
      DISABLE_SIGNUP: false,
      SECURITY_MANUAL_LINKING_ENABLED: true,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      MAILER_AUTOCONFIRM: false,
    } as ProjectAuthConfigData

    const states = getBasicAuthGitHubConfigStates(authConfig, {
      auth: {
        enable_signup: true,
        enable_manual_linking: true,
        enable_anonymous_sign_ins: false,
        email: { enable_confirmations: true },
      },
    })

    expect(states.DISABLE_SIGNUP.status).toBe('managed')
    expect(states.SECURITY_MANUAL_LINKING_ENABLED.status).toBe('managed')
    expect(states.EXTERNAL_ANONYMOUS_USERS_ENABLED.status).toBe('managed')
    expect(states.MAILER_AUTOCONFIRM.status).toBe('managed')
  })

  it('reports drift for the inverse-semantics signup and email confirmation fields', () => {
    const authConfig = {
      DISABLE_SIGNUP: true,
      SECURITY_MANUAL_LINKING_ENABLED: false,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      MAILER_AUTOCONFIRM: true,
    } as ProjectAuthConfigData

    const states = getBasicAuthGitHubConfigStates(authConfig, {
      auth: {
        enable_signup: true,
        email: { enable_confirmations: true },
      },
    })

    expect(states.DISABLE_SIGNUP).toMatchObject({
      status: 'drifted',
      githubValue: true,
    })
    expect(states.MAILER_AUTOCONFIRM).toMatchObject({
      status: 'drifted',
      githubValue: true,
    })
  })
})
