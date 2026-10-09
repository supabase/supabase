import { describe, expect, test } from 'vitest'

import { FRAMEWORKS, MOBILES, type ConnectionType } from '../Connect.constants'

// The "Add files" step renders `{{framework}}/{{frameworkVariant}}/{{library}}` (see
// connect.schema.ts), so every leaf of FRAMEWORKS/MOBILES needs a matching directory
// under content/. Without one the step silently renders nothing.
const contentModules = import.meta.glob('../content/**/content.{tsx,ts}')

/** Every selectable path through a framework's children, as a content directory path. */
function collectContentPaths(node: ConnectionType, prefix: string[] = []): string[] {
  const segments = [...prefix, node.key]
  if (!node.children?.length) return [segments.join('/')]
  return node.children.flatMap((child) => collectContentPaths(child, segments))
}

function hasContentModule(path: string) {
  return (
    `../content/${path}/content.tsx` in contentModules ||
    `../content/${path}/content.ts` in contentModules
  )
}

describe('Connect.constants', () => {
  test.each([...FRAMEWORKS, ...MOBILES].map((framework) => [framework.key, framework] as const))(
    '%s has step content for every library selection',
    (_key, framework) => {
      const paths = collectContentPaths(framework)
      expect(paths.length).toBeGreaterThan(0)

      for (const path of paths) {
        expect(hasContentModule(path), `missing content/${path}/content.tsx`).toBe(true)
      }
    }
  )
})
