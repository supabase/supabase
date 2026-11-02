import { describe, expect, it } from 'vitest'

import {
  getAssetCdnOrigin,
  getCdnUrlForBuiltFile,
  getTanstackAssetCdnUrl,
  isWorkerAsset,
  toCdnAssetUrl,
} from './asset-cdn'

const CDN = 'https://frontend-assets.supabase.com/studio/tanstack'

describe('getAssetCdnOrigin', () => {
  it('is disabled outside production', () => {
    expect(getAssetCdnOrigin({})).toBeUndefined()
    expect(getAssetCdnOrigin({ VERCEL_ENV: 'preview' })).toBeUndefined()
  })

  it('is enabled on production deployments', () => {
    expect(getAssetCdnOrigin({ VERCEL_ENV: 'production' })).toBe(
      'https://frontend-assets.supabase.com'
    )
  })

  it('can be force enabled', () => {
    expect(getAssetCdnOrigin({ FORCE_ASSET_CDN: '1' })).toBe('https://frontend-assets.supabase.com')
  })

  it('force disabling wins over a production deployment', () => {
    expect(getAssetCdnOrigin({ FORCE_ASSET_CDN: '-1', VERCEL_ENV: 'production' })).toBeUndefined()
  })

  it('uses the staging CDN on staging', () => {
    expect(
      getAssetCdnOrigin({ VERCEL_ENV: 'production', NEXT_PUBLIC_ENVIRONMENT: 'staging' })
    ).toBe('https://frontend-assets.supabase.green')
  })
})

describe('getTanstackAssetCdnUrl', () => {
  it('uses a shared folder under the site name', () => {
    expect(getTanstackAssetCdnUrl({ VERCEL_ENV: 'production', SITE_NAME: 'supabase-studio' })).toBe(
      'https://frontend-assets.supabase.com/supabase-studio/tanstack'
    )
  })

  it('defaults the site name to studio', () => {
    expect(getTanstackAssetCdnUrl({ VERCEL_ENV: 'production' })).toBe(CDN)
  })

  it('is undefined when the CDN is disabled', () => {
    expect(getTanstackAssetCdnUrl({ SITE_NAME: 'studio' })).toBeUndefined()
  })
})

describe('isWorkerAsset', () => {
  it('matches Vite worker output', () => {
    expect(isWorkerAsset('_vercel/immutable/initial/nitro/json.worker-BXx3_a-9.js')).toBe(true)
    expect(isWorkerAsset('_vercel/immutable/initial/nitro/editor.worker-Ab12Cd34.js')).toBe(true)
  })

  it('does not match regular chunks', () => {
    expect(isWorkerAsset('_vercel/immutable/initial/nitro/index-BKEvKWTwe3h6KAdk.js')).toBe(false)
    expect(isWorkerAsset('_vercel/immutable/initial/nitro/worker-utils-Ab12Cd34.js')).toBe(false)
  })
})

describe('getCdnUrlForBuiltFile', () => {
  it('points immutable assets at the CDN', () => {
    expect(getCdnUrlForBuiltFile('_vercel/immutable/initial/nitro/index-abc123.js', CDN)).toBe(
      `${CDN}/_vercel/immutable/initial/nitro/index-abc123.js`
    )
    expect(getCdnUrlForBuiltFile('_vercel/immutable/initial/nitro/font-abc123.woff2', CDN)).toBe(
      `${CDN}/_vercel/immutable/initial/nitro/font-abc123.woff2`
    )
  })

  it('keeps workers on the host', () => {
    expect(
      getCdnUrlForBuiltFile('_vercel/immutable/initial/nitro/json.worker-abc123.js', CDN)
    ).toBeUndefined()
  })

  it('keeps files outside the immutable store on the host', () => {
    expect(getCdnUrlForBuiltFile('assets/index-abc123.js', CDN)).toBeUndefined()
  })

  it('is undefined when the CDN is disabled', () => {
    expect(
      getCdnUrlForBuiltFile('_vercel/immutable/initial/nitro/index-abc123.js', undefined)
    ).toBeUndefined()
  })
})

describe('toCdnAssetUrl', () => {
  it('strips the base path from manifest URLs', () => {
    expect(
      toCdnAssetUrl('/dashboard/_vercel/immutable/initial/nitro/index-abc.js', CDN, '/dashboard')
    ).toBe(`${CDN}/_vercel/immutable/initial/nitro/index-abc.js`)
  })

  it('works without a base path', () => {
    expect(toCdnAssetUrl('/_vercel/immutable/initial/nitro/index-abc.js', CDN)).toBe(
      `${CDN}/_vercel/immutable/initial/nitro/index-abc.js`
    )
  })

  it('leaves other URLs unchanged', () => {
    expect(toCdnAssetUrl('/dashboard/favicon/favicon.ico', CDN, '/dashboard')).toBe(
      '/dashboard/favicon/favicon.ico'
    )
    expect(toCdnAssetUrl('/other/_vercel/immutable/x.js', CDN, '/dashboard')).toBe(
      '/other/_vercel/immutable/x.js'
    )
    expect(
      toCdnAssetUrl(
        '/dashboard/_vercel/immutable/initial/nitro/json.worker-abc.js',
        CDN,
        '/dashboard'
      )
    ).toBe('/dashboard/_vercel/immutable/initial/nitro/json.worker-abc.js')
    expect(
      toCdnAssetUrl(
        '/dashboard/_vercel/immutable/initial/nitro/index-abc.js',
        undefined,
        '/dashboard'
      )
    ).toBe('/dashboard/_vercel/immutable/initial/nitro/index-abc.js')
  })
})
