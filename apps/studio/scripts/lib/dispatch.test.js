import { describe, expect, it } from 'vitest'

import { getDispatchScript, getPnpmSpawnOptions } from './dispatch.js'

describe('getPnpmSpawnOptions', () => {
  it('uses a shell to resolve pnpm.cmd on Windows', () => {
    expect(getPnpmSpawnOptions('win32')).toEqual({ shell: true })
  })

  it('does not add a shell on non-Windows platforms', () => {
    expect(getPnpmSpawnOptions('linux')).toEqual({ shell: false })
  })

  it('allowlists dispatched scripts before passing arguments to a Windows shell', () => {
    expect(getDispatchScript('dev')).toBe('dev:next')
    expect(getDispatchScript('build', 'tanstack')).toBe('build:tanstack')
    expect(getDispatchScript('dev & whoami')).toBeNull()
  })
})
