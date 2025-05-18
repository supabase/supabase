import { Registry } from '@/registry/schema'
import { examples } from '@/registry//examples'
import { fragments } from '@/registry/fragments'
import { charts } from '@/registry/charts'

export const registry: Registry = [...fragments, ...examples, ...charts]
