import { describe, expect, it } from 'vitest'

import { getDispatchScript, getPnpmSpawnInvocation } from './dispatch.js'

describe('getPnpmSpawnInvocation', () => {
  it('uses a validated command string to resolve pnpm.cmd on Windows', () => {
    expect(getPnpmSpawnInvocation('dev:next', 'win32')).toEqual({
      command: 'pnpm run dev:next',
      args: [],
      options: { shell: true },
    })
  })

  it('uses an executable and argument array on non-Windows platforms', () => {
    expect(getPnpmSpawnInvocation('build:tanstack', 'linux')).toEqual({
      command: 'pnpm',
      args: ['run', 'build:tanstack'],
      options: { shell: false },
    })
  })

  it('allowlists dispatched scripts before passing a command to a Windows shell', () => {
    expect(getDispatchScript('dev')).toBe('dev:next')
    expect(getDispatchScript('build', 'tanstack')).toBe('build:tanstack')
    expect(getDispatchScript('dev & whoami')).toBeNull()
    expect(getPnpmSpawnInvocation('dev:next & whoami', 'win32')).toBeNull()
  })
})
