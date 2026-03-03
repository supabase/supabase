import type { Profile } from './types'

export interface ProfileService {
  getProfile: (signal?: AbortSignal) => Promise<Profile>
}
