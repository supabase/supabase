import { type Registry } from 'shadcn/registry'

import { clients } from './clients'
import { passwordBasedAuth } from './password-based-auth'

export const registry = {
  name: 'Supabase UI Library',
  homepage: 'https://supabase.com/ui',
  items: [...clients, ...passwordBasedAuth],
} satisfies Registry
