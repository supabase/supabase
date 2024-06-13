import type { components } from 'data/api'

export type Profile = components['schemas']['ProfileResponse']

export type Feature = Profile['disabled_features'][number]
