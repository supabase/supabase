import { examples } from '@/registry//examples'
import { charts } from '@/registry/charts'
import { copyWriting } from '@/registry/copy-writing'
import { fragments } from '@/registry/fragments'
import { Registry } from '@/registry/schema'

export const registry: Registry = [...fragments, ...examples, ...charts, ...copyWriting]
