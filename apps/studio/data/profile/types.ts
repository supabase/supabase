import type { components } from 'data/api'

export type Profile = components['schemas']['ProfileResponse'] & {
  profileImageUrl?: string
}
