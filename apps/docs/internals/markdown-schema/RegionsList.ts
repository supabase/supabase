import { createRequire } from 'node:module'

// tsx's ESM loader can't pick up named exports from the `shared-data` package
// (CJS, no `"type": "module"`). Load via `createRequire` for CJS interop —
// this file only runs in the build script, never in the Next.js bundle.
const req = createRequire(import.meta.url)
const { AWS_REGIONS } = req('shared-data') as {
  AWS_REGIONS: Record<string, { displayName: string; code: string }>
}
const { SMART_REGION_TO_EXACT_REGION_MAP } = req('shared-data/regions') as {
  SMART_REGION_TO_EXACT_REGION_MAP: Map<string, string>
}

export const RegionsList = (): string =>
  Object.values(AWS_REGIONS)
    .map((r) => `- ${r.displayName}, \`${r.code}\``)
    .join('\n')

export const SmartRegionsList = (): string =>
  [...SMART_REGION_TO_EXACT_REGION_MAP.entries()]
    .map(([smart, exact]) => `- ${smart}, \`${exact}\``)
    .join('\n')
