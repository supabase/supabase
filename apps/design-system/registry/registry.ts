import { Registry } from '@/registry/schema'
import { ui } from '@/registry/ui'
import { examples } from '@/registry//examples'
import { fragments } from '@/registry/fragments'
// import { blocks } from '@/registry/blocks'

export const registry: Registry = [
  ...ui,
  ...fragments,
  ...examples,
  // ...blocks
]
