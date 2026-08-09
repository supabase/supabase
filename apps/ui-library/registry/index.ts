import { blocks as vueBlocks } from '@supabase/vue-blocks'
import { type Registry } from 'shadcn/schema'

import { blocks } from './blocks'
import { clients } from './clients'
import { platform } from './platform'
import { examples } from '@/registry/examples'

export const registry = {
  name: 'Supabase UI Library',
  homepage: 'https://supabase.com/ui',
  items: [
    ...blocks,
    ...clients,
    ...platform,
    ...vueBlocks,

    // Internal use only.
    ...examples,
  ],
} satisfies Registry
