import { EventEmitter } from 'node:events'
import { vi } from 'vitest'

const spawnMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}))

import {
  buildFlameGenerateArgs,
  generateFlameArtifacts,
  getFlameCommand,
  normalizeFlameEnvironment,
  resolveFlameMdFormat,
} from './flame'

function createFakeChild() {
  return new EventEmitter() as EventEmitter & {
    once: EventEmitter['once']
  }
}

describe('flame helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aliases FLAME_SOURCEMAPS_DIRS to FLAME_SOURCEMAP_DIRS', () => {
    expect(
      normalizeFlameEnvironment({
        FLAME_SOURCEMAPS_DIRS: 'dist',
      })
    ).toMatchObject({
      FLAME_SOURCEMAP_DIRS: 'dist',
      FLAME_SOURCEMAPS_DIRS: 'dist',
    })
  })

  it('keeps an explicit FLAME_SOURCEMAP_DIRS value', () => {
    expect(
      normalizeFlameEnvironment({
        FLAME_SOURCEMAP_DIRS: 'build',
        FLAME_SOURCEMAPS_DIRS: 'dist',
      })
    ).toMatchObject({
      FLAME_SOURCEMAP_DIRS: 'build',
      FLAME_SOURCEMAPS_DIRS: 'dist',
    })
  })

  it('builds flame generate args with an optional markdown format', () => {
    expect(buildFlameGenerateArgs('/tmp/profile.pprof')).toEqual(['generate', '/tmp/profile.pprof'])

    expect(buildFlameGenerateArgs('/tmp/profile.pprof', 'detailed')).toEqual([
      'generate',
      '--md-format=detailed',
      '/tmp/profile.pprof',
    ])
  })

  it('rejects unsupported markdown formats', () => {
    expect(() => resolveFlameMdFormat('verbose')).toThrow('Invalid PPROF_FLAME_MD_FORMAT')
  })

  it('spawns flame generate with inherited stdio', async () => {
    const child = createFakeChild()
    spawnMock.mockReturnValue(child)

    const generationPromise = generateFlameArtifacts('/tmp/profile.pprof', {
      env: {
        FLAME_SOURCEMAPS_DIRS: 'dist',
      },
      mdFormat: 'summary',
    })

    expect(spawnMock).toHaveBeenCalledWith(
      getFlameCommand(),
      ['generate', '--md-format=summary', '/tmp/profile.pprof'],
      {
        env: expect.objectContaining({
          FLAME_SOURCEMAP_DIRS: 'dist',
          FLAME_SOURCEMAPS_DIRS: 'dist',
        }),
        stdio: 'inherit',
      }
    )

    child.emit('exit', 0, null)
    await expect(generationPromise).resolves.toBeUndefined()
  })
})
