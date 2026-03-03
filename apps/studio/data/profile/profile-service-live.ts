import { getProfile } from './profile-query'
import type { ProfileService } from './profile-service'

export const profileServiceLive: ProfileService = {
  getProfile,
}
