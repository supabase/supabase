import { Registry } from '@/registry/schema'
import { examples } from '@/registry//examples'
import { fragments } from '@/registry/fragments'

export const registry: Registry = [...fragments, ...examples]
