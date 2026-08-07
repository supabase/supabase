import { describe, expect, it } from 'vitest'

import {
  DEFAULT_STUDIO_PORT,
  TANSTACK_DEV_NODE_OPTIONS,
  getChildEnv,
  getDevServerArgs,
  getDispatchScript,
  getPnpmSpawnInvocation,
  resolveStudioPort,
} from './dispatch.js'

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

  it('forwards script arguments after `--` on both platforms', () => {
    expect(getPnpmSpawnInvocation('dev:next', 'win32', ['-p', '8082'])).toEqual({
      command: 'pnpm run dev:next -- -p 8082',
      args: [],
      options: { shell: true },
    })
    expect(getPnpmSpawnInvocation('dev:next', 'linux', ['-p', '8082'])).toEqual({
      command: 'pnpm',
      args: ['run', 'dev:next', '--', '-p', '8082'],
      options: { shell: false },
    })
  })

  it('rejects forwarded arguments that could break out of the Windows command string', () => {
    expect(getPnpmSpawnInvocation('dev:next', 'win32', ['-p', '8082 & whoami'])).toBeNull()
    expect(getPnpmSpawnInvocation('dev:next', 'win32', ['-p', '"8082"'])).toBeNull()
  })
})

describe('resolveStudioPort', () => {
  it('falls back to the default when nothing is set', () => {
    expect(resolveStudioPort(undefined, undefined)).toBe(DEFAULT_STUDIO_PORT)
    expect(resolveStudioPort('', undefined)).toBe(DEFAULT_STUDIO_PORT)
  })

  it('takes the first candidate that is set, so the shell env beats the env files', () => {
    expect(resolveStudioPort('3000', '9000')).toBe(3000)
    expect(resolveStudioPort(undefined, '9000')).toBe(9000)
  })

  it('rejects values that are not a port instead of forwarding them to the dev server', () => {
    // `${STUDIO_PORT:-8082}` is what an unexpanded POSIX default looked like
    // on Windows before this was resolved in JavaScript.
    expect(resolveStudioPort('${STUDIO_PORT:-8082}')).toBeNull()
    expect(resolveStudioPort('8082; whoami')).toBeNull()
    expect(resolveStudioPort('-1')).toBeNull()
    expect(resolveStudioPort('70000')).toBeNull()
    expect(resolveStudioPort('80.5')).toBeNull()
  })
})

describe('getDevServerArgs', () => {
  it('uses the port flag each dev server understands', () => {
    expect(getDevServerArgs('dev:next', 8082)).toEqual(['-p', '8082'])
    expect(getDevServerArgs('dev:tanstack', 8082)).toEqual(['--port', '8082'])
  })

  it('adds nothing for targets that do not take a port', () => {
    expect(getDevServerArgs('build:next', 8082)).toEqual([])
    expect(getDevServerArgs('start:next', 8082)).toEqual([])
  })
})

describe('getChildEnv', () => {
  it('sets the larger heap for the tanstack dev server without a POSIX prefix', () => {
    expect(getChildEnv('dev:tanstack', { PATH: '/usr/bin' })).toEqual({
      PATH: '/usr/bin',
      NODE_OPTIONS: TANSTACK_DEV_NODE_OPTIONS,
    })
  })

  it('leaves every other target untouched', () => {
    expect(getChildEnv('dev:next', { PATH: '/usr/bin' })).toEqual({ PATH: '/usr/bin' })
  })
})
