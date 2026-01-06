import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('constants/index', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('should set IS_PLATFORM to true when NEXT_PUBLIC_IS_PLATFORM is "true"', async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'true')

    const { IS_PLATFORM } = await import('./index')

    expect(IS_PLATFORM).toBe(true)
  })

  it('should set IS_PLATFORM to false when NEXT_PUBLIC_IS_PLATFORM is not "true"', async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')

    const { IS_PLATFORM } = await import('./index')

    expect(IS_PLATFORM).toBe(false)
  })

  it('should return test API_URL when NODE_ENV is test', async () => {
    vi.stubEnv('NODE_ENV', 'test')

    const { API_URL } = await import('./index')

    expect(API_URL).toBe('http://localhost:3000/api')
  })

  it('should return NEXT_PUBLIC_API_URL when IS_PLATFORM is true', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'true')
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.supabase.co')

    const { API_URL } = await import('./index')

    expect(API_URL).toBe('https://api.supabase.co')
  })

  it('should return /api when running in browser', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')
    vi.stubGlobal('window', {})

    const { API_URL } = await import('./index')

    expect(API_URL).toBe('/api')
  })

  it('should return VERCEL_URL based API_URL when VERCEL_URL is set', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')
    vi.stubEnv('VERCEL_URL', 'my-app.vercel.app')
    // Ensure window is undefined so we reach the VERCEL_URL branch
    vi.stubGlobal('window', undefined)

    const { API_URL } = await import('./index')

    expect(API_URL).toBe('https://my-app.vercel.app/api')
  })

  it('should return NEXT_PUBLIC_SITE_URL based API_URL when set', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://self-hosted.example.com')
    // Ensure window is undefined so we reach the NEXT_PUBLIC_SITE_URL branch
    vi.stubGlobal('window', undefined)

    const { API_URL } = await import('./index')

    expect(API_URL).toBe('https://self-hosted.example.com/api')
  })

  it('should set BASE_PATH from NEXT_PUBLIC_BASE_PATH', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/base')

    const { BASE_PATH } = await import('./index')

    expect(BASE_PATH).toBe('/base')
  })

  it('should set BASE_PATH to empty string when not set', async () => {
    const { BASE_PATH } = await import('./index')

    expect(BASE_PATH).toBe('')
  })

  it('should set PG_META_URL from PLATFORM_PG_META_URL when IS_PLATFORM is true', async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'true')
    vi.stubEnv('PLATFORM_PG_META_URL', 'https://pg-meta.platform.com')

    const { PG_META_URL } = await import('./index')

    expect(PG_META_URL).toBe('https://pg-meta.platform.com')
  })

  it('should set PG_META_URL from STUDIO_PG_META_URL when IS_PLATFORM is false', async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')
    vi.stubEnv('STUDIO_PG_META_URL', 'https://pg-meta.studio.com')

    const { PG_META_URL } = await import('./index')

    expect(PG_META_URL).toBe('https://pg-meta.studio.com')
  })

  it('should export constants with correct values', async () => {
    const constants = await import('./index')

    expect(constants.DATE_FORMAT).toBe('YYYY-MM-DDTHH:mm:ssZ')
    expect(constants.DATETIME_FORMAT).toBe('DD MMM YYYY, HH:mm:ss (ZZ)')
    expect(constants.USAGE_APPROACHING_THRESHOLD).toBe(0.75)
    expect(constants.GB).toBe(1024 * 1024 * 1024)
    expect(constants.MB).toBe(1024 * 1024)
    expect(constants.KB).toBe(1024)
    expect(constants.UUID_REGEX).toBeInstanceOf(RegExp)
  })
})

