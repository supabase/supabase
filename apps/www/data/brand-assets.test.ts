import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { BRAND_ASSETS } from './brand-assets'

const publicFile = (url: string) => readFileSync(path.join(process.cwd(), 'public', url))

describe('brand assets catalog', () => {
  it.for(BRAND_ASSETS)('$id files match the catalog', (asset) => {
    expect(publicFile(asset.svg).toString('utf-8')).toContain('<svg')

    const png = publicFile(asset.png)
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([asset.pngWidth, asset.pngHeight])
  })

  it('the markdown digest links every catalog file', () => {
    const markdown = readFileSync(path.join(process.cwd(), 'content/md/brand-assets.md'), 'utf-8')
    for (const asset of BRAND_ASSETS) {
      expect(markdown).toContain(`(https://supabase.com${asset.svg})`)
      expect(markdown).toContain(`(https://supabase.com${asset.png})`)
    }
  })
})
