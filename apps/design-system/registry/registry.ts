import { Registry } from './schema'
import { ui } from './ui'
// import { blocks } from '@/registry/blocks'
import { examples } from './examples'

export const registry: Registry = [
  ...ui,
  ...examples,
  // ...blocks
]
