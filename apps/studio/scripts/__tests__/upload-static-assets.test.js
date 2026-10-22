import { describe, expect, it } from 'vitest'

import { shouldUploadStaticAssets } from '../upload-static-assets.js'

describe('shouldUploadStaticAssets', () => {
  it('skips local builds without needing bash', () => {
    expect(shouldUploadStaticAssets({})).toBe(false)
    expect(shouldUploadStaticAssets({ VERCEL_ENV: 'preview' })).toBe(false)
  })

  it('uploads on production or forced builds', () => {
    expect(shouldUploadStaticAssets({ VERCEL_ENV: 'production' })).toBe(true)
    expect(shouldUploadStaticAssets({ FORCE_ASSET_CDN: '1' })).toBe(true)
  })

  it('honours SKIP_ASSET_UPLOAD=1 and FORCE_ASSET_CDN=-1', () => {
    expect(shouldUploadStaticAssets({ VERCEL_ENV: 'production', SKIP_ASSET_UPLOAD: '1' })).toBe(
      false
    )
    expect(shouldUploadStaticAssets({ VERCEL_ENV: 'production', FORCE_ASSET_CDN: '-1' })).toBe(
      false
    )
  })
})
