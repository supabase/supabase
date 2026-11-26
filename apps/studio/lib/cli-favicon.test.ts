import { afterEach, describe, expect, it, vi } from 'vitest'

import { getCLIFaviconRoute } from './cli-favicon'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: (handler: () => string) => handler }),
}))

afterEach(() => vi.unstubAllEnvs())

describe('CLI favicon route', () => {
  it('reads the CLI version at request time, after the module has loaded', async () => {
    vi.stubEnv('CURRENT_CLI_VERSION', '')
    expect(await getCLIFaviconRoute()).toBe('/favicon')

    vi.stubEnv('CURRENT_CLI_VERSION', '2.50.0')
    expect(await getCLIFaviconRoute()).toBe('/favicon/local')

    vi.stubEnv('CURRENT_CLI_VERSION', '')
    expect(await getCLIFaviconRoute()).toBe('/favicon')
  })
})
