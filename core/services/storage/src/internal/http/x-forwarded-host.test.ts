const xForwardedHostEnvKeys = [
  'MULTI_TENANT',
  'IS_MULTITENANT',
  'REQUEST_X_FORWARDED_HOST_REGEXP',
  'X_FORWARDED_HOST_REGEXP',
] as const

const originalEnv = Object.fromEntries(
  xForwardedHostEnvKeys.map((key) => [key, process.env[key]])
) as Record<(typeof xForwardedHostEnvKeys)[number], string | undefined>

async function loadXForwardedHostRegExp({
  isMultitenant,
  pattern,
}: {
  isMultitenant: boolean
  pattern?: string
}) {
  vi.resetModules()

  process.env.MULTI_TENANT = isMultitenant ? 'true' : 'false'
  process.env.IS_MULTITENANT = isMultitenant ? 'true' : 'false'
  process.env.X_FORWARDED_HOST_REGEXP = ''

  if (pattern === undefined) {
    process.env.REQUEST_X_FORWARDED_HOST_REGEXP = ''
  } else {
    process.env.REQUEST_X_FORWARDED_HOST_REGEXP = pattern
  }

  return await import('./x-forwarded-host')
}

function restoreXForwardedHostEnv() {
  for (const key of xForwardedHostEnvKeys) {
    const value = originalEnv[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

afterEach(() => {
  restoreXForwardedHostEnv()
  vi.resetModules()
})

describe('getXForwardedHostRegExp', () => {
  it('skips compiling the host pattern when multitenancy is disabled', async () => {
    const { getXForwardedHostRegExp } = await loadXForwardedHostRegExp({
      isMultitenant: false,
      pattern: '[',
    })

    expect(getXForwardedHostRegExp()).toBeUndefined()
  })

  it('returns undefined when no host pattern is configured', async () => {
    const { getXForwardedHostRegExp } = await loadXForwardedHostRegExp({
      isMultitenant: true,
    })

    expect(getXForwardedHostRegExp()).toBeUndefined()
  })

  it('reuses the compiled regexp from startup config', async () => {
    const { getXForwardedHostRegExp } = await loadXForwardedHostRegExp({
      isMultitenant: true,
      pattern: '^([a-z]+)\\.local$',
    })

    const first = getXForwardedHostRegExp()
    const second = getXForwardedHostRegExp()

    expect(second).toBe(first)
    expect('tenant.local'.match(first!)).toBeTruthy()
  })

  it('does not recompile when config is reloaded after module load', async () => {
    const { getXForwardedHostRegExp } = await loadXForwardedHostRegExp({
      isMultitenant: true,
      pattern: '^([a-z]+)\\.local$',
    })
    const previous = getXForwardedHostRegExp()

    process.env.REQUEST_X_FORWARDED_HOST_REGEXP = '^([0-9]+)\\.local$'
    const { getConfig } = await import('../../config')
    getConfig({ reload: true })

    const current = getXForwardedHostRegExp()

    expect(current).toBe(previous)
    expect('tenant.local'.match(current!)).toBeTruthy()
    expect('123.local'.match(current!)).toBeFalsy()
  })

  it('throws while loading the helper when the configured pattern is invalid', async () => {
    await expect(
      loadXForwardedHostRegExp({
        isMultitenant: true,
        pattern: '[',
      })
    ).rejects.toThrow(SyntaxError)
  })
})
