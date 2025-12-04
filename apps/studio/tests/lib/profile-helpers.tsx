import type { Profile } from 'data/profile/types'
import type { ProfileContextType } from 'lib/profile'

export const createMockProfile = (overrides: Partial<Profile> = {}): Profile => {
  const baseProfile: Profile = {
    id: 1,
    primary_email: 'test@example.com',
    username: 'test-user',
    first_name: 'Test',
    last_name: 'User',
    auth0_id: 'github|test-user',
    is_alpha_user: false,
    disabled_features: [],
    free_project_limit: 2,
    gotrue_id: '00000000-0000-0000-0000-000000000000',
    is_sso_user: false,
    mobile: '000-000-0000',
  }

  return Object.assign(baseProfile, overrides)
}

export const createMockProfileContext = (
  overrides: Partial<ProfileContextType> = {}
): ProfileContextType => {
  return {
    profile: overrides.profile ?? createMockProfile(),
    error: overrides.error ?? null,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    isSuccess: overrides.isSuccess ?? true,
  }
}
