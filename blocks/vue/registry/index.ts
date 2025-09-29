import { type Registry } from 'shadcn/registry'

import { clients } from './clients'

export const registry = {
  name: 'Supabase UI Library',
  homepage: 'https://supabase.com/ui',
  items: [...clients],
} satisfies Registry
