import type { ProjectAuthConfigData } from '@/data/auth/auth-config-query'
import { getAuthFieldConfigState } from '@/lib/github-config-drift'

export function getBasicAuthGitHubConfigStates(
  authConfig: ProjectAuthConfigData,
  githubConfig?: Record<string, unknown>
) {
  return {
    DISABLE_SIGNUP: getAuthFieldConfigState({
      fieldName: 'DISABLE_SIGNUP',
      dashboardValue: !authConfig.DISABLE_SIGNUP,
      githubConfig,
    }),
    SECURITY_MANUAL_LINKING_ENABLED: getAuthFieldConfigState({
      fieldName: 'SECURITY_MANUAL_LINKING_ENABLED',
      dashboardValue: authConfig.SECURITY_MANUAL_LINKING_ENABLED,
      githubConfig,
    }),
    EXTERNAL_ANONYMOUS_USERS_ENABLED: getAuthFieldConfigState({
      fieldName: 'EXTERNAL_ANONYMOUS_USERS_ENABLED',
      dashboardValue: authConfig.EXTERNAL_ANONYMOUS_USERS_ENABLED,
      githubConfig,
    }),
    MAILER_AUTOCONFIRM: getAuthFieldConfigState({
      fieldName: 'MAILER_AUTOCONFIRM',
      dashboardValue: !authConfig.MAILER_AUTOCONFIRM,
      githubConfig,
    }),
  }
}
