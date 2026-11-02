import { blocks as vueBlocks } from '@supabase/vue-blocks'
import { type Registry } from 'shadcn/schema'

import { blocks } from './blocks'
import { clients } from './clients'
import { platform } from './platform'
import { examples } from '@/registry/examples'

export const registry = {
  name: 'Supabase Library',
  homepage: 'https://supabase.com/library',
  items: [
    ...blocks,
    ...clients,
    ...platform,
    ...vueBlocks,

    // Internal use only.
    ...examples,
  ],
} satisfies Registry
