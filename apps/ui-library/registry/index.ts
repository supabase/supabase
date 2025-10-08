import { type Registry, type RegistryItem } from 'shadcn/schema'

import { examples } from '@/registry/examples'
import { blocks as vueBlocks } from '@supabase/vue-blocks'
import { blocks } from './blocks'
import { clients } from './clients'
import aiEditorRules from './default/ai-editor-rules/registry-item.json' with { type: 'json' }
import { platform } from './platform'

export const registry = {
  name: 'Supabase UI Library',
  homepage: 'https://supabase.com/ui',
  items: [
    ...blocks,
    ...clients,
    ...platform,
    ...vueBlocks,
    aiEditorRules as RegistryItem,

    // Internal use only.
    ...examples,
  ],
} satisfies Registry
