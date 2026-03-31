import { IS_PLATFORM } from 'lib/constants'

export const getDashboardSettingsUrl = (projectRef?: string) => {
  if (IS_PLATFORM) {
    return '/account/me#dashboard'
  }

  return `/project/${projectRef}/settings/preferences#dashboard`
}
