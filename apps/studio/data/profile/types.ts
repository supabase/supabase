import type { components } from 'data/api'

export type Profile = components['schemas']['ProfileResponse'] & {
  profileImageUrl?: string
}

export type Feature = Profile['disabled_features'][number]
