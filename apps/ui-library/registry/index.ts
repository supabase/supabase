import { type Registry } from 'shadcn/registry'

import { examples } from '@/registry/examples'
import { blocks } from './blocks'
import { clients } from './clients'

export const registry = {
  name: 'Supabase UI Library',
  homepage: 'https://supabase.com/ui',
  items: [
    ...blocks,
    ...clients,

    // Internal use only.
    ...examples,
  ],
} satisfies Registry
