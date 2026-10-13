import { execFile } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'
import { nitro } from 'nitro/vite'
import { createBuilder, resolveConfig, type Plugin, type UserConfigFn } from 'vite'
import { afterEach, describe, expect, it, vi } from 'vitest'

import studioConfig, { sentryForFinalOutputs, serverSourceMaps } from '../../vite.config'

const captured = vi.hoisted(() => ({
  nitro: undefined as Parameters<typeof nitro>[0] | undefined,
  sentry: undefined as Parameters<typeof sentryTanstackStart>[0] | undefined,
  sentryPlugins: [] as Plugin[],
}))
vi.mock('nitro/vite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('nitro/vite')>()
  return {
    ...actual,
    nitro: (options: Parameters<typeof nitro>[0]) => {
      captured.nitro = options
      return actual.nitro(options)
    },
  }
})
vi.mock('@sentry/tanstackstart-react/vite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sentry/tanstackstart-react/vite')>()
  return {
    ...actual,
    sentryTanstackStart: (options: Parameters<typeof sentryTanstackStart>[0]) => {
      captured.sentry = options
      const plugins = actual.sentryTanstackStart(options)
      captured.sentryPlugins = plugins
      return plugins
    },
  }
})

const execFileAsync = promisify(execFile)

const studioRoot = path.resolve(import.meta.dirname, '../..')
const temporaryDirs: string[] = []
const require = createRequire(path.join(studioRoot, 'package.json'))
const sentryRequire = createRequire(require.resolve('@sentry/tanstackstart-react/vite'))
const bundlerRequire = createRequire(sentryRequire.resolve('@sentry/vite-plugin'))
const {
  TraceMap,
  originalPositionFor,
}: {
  TraceMap: new (map: SourceMap) => unknown
  originalPositionFor: (
    map: unknown,
    position: { line: number; column: number }
  ) => { source: string | null; line: number | null }
} = bundlerRequire('@jridgewell/trace-mapping')

type SourceMap = {
  version: 3
  sources: string[]
  sourcesContent: string[]
  names: string[]
  mappings: string
}

async function resolveStudioConfig(
  hasUploadToken: boolean,
  isVercel: boolean,
  shouldSkipUpload = !hasUploadToken
) {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('SKIP_ASSET_UPLOAD', shouldSkipUpload ? '1' : '')
  vi.stubEnv('SENTRY_AUTH_TOKEN', hasUploadToken ? 'test-token-never-uploaded' : '')
  vi.stubEnv('SENTRY_URL', 'http://127.0.0.1:9')
  vi.stubEnv('VERCEL', isVercel ? '1' : '')
  const config = await (studioConfig as UserConfigFn)({ command: 'build', mode: 'production' })
  return resolveConfig(
    { ...config, configFile: false, root: studioRoot, logLevel: 'silent' },
    'build'
  )
}

async function mapFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) return mapFiles(file)
      return entry.name.endsWith('.map') ? [file] : []
    })
  )
  return files.flat()
}

afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(temporaryDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('server source maps', () => {
  it('filters only intermediate build injection while preserving SDK SSR instrumentation plugins', async () => {
    await resolveStudioConfig(true, false)
    const plugins = sentryForFinalOutputs({ ...captured.sentry, autoInstrumentMiddleware: true })
    const sdkPlugins = captured.sentryPlugins
    expect(plugins.map((plugin) => plugin.name)).toContain('sentry-tanstackstart-route-patterns')
    expect(plugins.map((plugin) => plugin.name)).toContain(
      'sentry-tanstack-middleware-auto-instrument'
    )
    for (const plugin of sdkPlugins) {
      if (plugin.name !== 'sentry-vite-plugin') expect(plugins).toContain(plugin)
    }
    const injection = plugins.find((plugin) => plugin.name === 'sentry-vite-plugin')
    if (!injection?.applyToEnvironment) throw new Error('Expected Sentry output environment filter')
    for (const name of ['client', 'nitro']) {
      expect(
        await injection.applyToEnvironment({
          name,
          getTopLevelConfig: () => ({ command: 'build' }),
        } as never)
      ).toBe(true)
    }
    expect(
      await injection.applyToEnvironment({
        name: 'ssr',
        getTopLevelConfig: () => ({ command: 'build' }),
      } as never)
    ).toBe(false)
    expect(
      await injection.applyToEnvironment({
        name: 'ssr',
        getTopLevelConfig: () => ({ command: 'serve' }),
      } as never)
    ).toBe(true)
  })

  it('loads only adjacent maps inside the resolved SSR output and propagates I/O failures', async () => {
    const root = await realpath(await mkdtemp(path.join(tmpdir(), 'studio-source-map-loader-')))
    temporaryDirs.push(root)
    const config = await resolveStudioConfig(false, false)
    config.environments.ssr.build.outDir = path.join(root, 'ssr')
    await mkdir(config.environments.ssr.build.outDir)
    const plugin = serverSourceMaps()
    expect(plugin.apply).toBe('build')
    if (
      typeof plugin.applyToEnvironment !== 'function' ||
      typeof plugin.configResolved !== 'function' ||
      typeof plugin.load !== 'function'
    ) {
      throw new Error('Expected source-map environment, config, and load hooks')
    }
    expect(plugin.applyToEnvironment({ name: 'client' } as never)).toBe(false)
    expect(plugin.applyToEnvironment({ name: 'ssr' } as never)).toBe(false)
    expect(plugin.applyToEnvironment({ name: 'nitro' } as never)).toBe(true)
    await plugin.configResolved.call({} as never, config)
    const codeFile = path.join(config.environments.ssr.build.outDir, 'entry.mjs')
    const map = JSON.stringify({
      version: 3,
      sources: [],
      sourcesContent: [],
      names: [],
      mappings: '',
    })
    await writeFile(codeFile, 'export const marker = 1')
    await writeFile(`${codeFile}.map`, map)
    expect(await plugin.load.call({} as never, codeFile)).toEqual({
      code: 'export const marker = 1',
      map,
    })
    expect(await plugin.load.call({} as never, path.join(root, 'unrelated.mjs'))).toBeUndefined()
    expect(
      await plugin.load.call({} as never, path.join(root, 'ssr-other/entry.mjs'))
    ).toBeUndefined()
    expect(await plugin.load.call({} as never, `${codeFile}.map`)).toBeUndefined()
    expect(await plugin.load.call({} as never, path.join(root, 'ssr/missing.mjs'))).toBeUndefined()
    await rm(`${codeFile}.map`)
    await mkdir(`${codeFile}.map`)
    await expect(plugin.load.call({} as never, codeFile)).rejects.toMatchObject({ code: 'EISDIR' })
  })

  it.each([
    [false, false, true],
    [false, true, true],
    [true, false, false],
    [true, true, false],
    [false, false, false],
    [true, false, true],
  ])(
    'enables both server stages with token=%s, Vercel=%s, skip=%s',
    async (hasToken, isVercel, shouldSkipUpload) => {
      const config = await resolveStudioConfig(hasToken, isVercel, shouldSkipUpload)
      expect(config.environments.ssr.build.sourcemap).toBe(true)
      expect(config.environments.nitro.build.sourcemap).toBe(true)
      expect(config.environments.client.build.sourcemap).toBe(
        hasToken && !shouldSkipUpload ? 'hidden' : false
      )
      expect(captured.nitro?.experimental?.sourcemapMinify).toBe(false)
      expect(captured.sentry?.sourcemaps?.filesToDeleteAfterUpload).toEqual([
        path.join(studioRoot, '.output/public/**/*.map'),
        path.join(studioRoot, '.vercel/output/static/**/*.map'),
        ...(hasToken && !shouldSkipUpload
          ? [
              path.join(studioRoot, '.output/server/**/*.map'),
              path.join(studioRoot, '.vercel/output/functions/**/*.map'),
            ]
          : []),
      ])
    }
  )

  it.each([
    [false, false, false],
    [true, false, false],
    [true, false, true],
    [false, true, false],
  ])(
    'composes original TS before cleanup with instrumentation=%s, malformed map=%s, Vercel=%s',
    async (hasInstrumentation, hasMalformedMap, isVercel) => {
      const config = await resolveStudioConfig(hasInstrumentation, isVercel)
      vi.stubEnv('VERCEL_IMMUTABLE_STATIC_FILES_ENABLED', '1')
      vi.stubEnv('VERCEL_HASH_SALT', 'source-map-fixture')
      const nitroOptions = captured.nitro!
      const sentryOptions = captured.sentry!
      const cleanupGlobs = sentryOptions.sourcemaps?.filesToDeleteAfterUpload
      if (!Array.isArray(cleanupGlobs))
        throw new Error('Expected explicit source-map cleanup globs')
      const root = await realpath(await mkdtemp(path.join(tmpdir(), 'studio-source-maps-')))
      temporaryDirs.push(root)
      await mkdir(path.join(root, 'node_modules'))
      await symlink(
        await realpath(path.join(studioRoot, 'node_modules/nitro')),
        path.join(root, 'node_modules/nitro'),
        'dir'
      )
      await writeFile(
        path.join(root, 'index.html'),
        '<html><body><!--ssr-outlet--><script type="module" src="/client.ts"></script></body></html>'
      )
      await writeFile(path.join(root, 'client.ts'), 'console.log("source-map-fixture")')
      const originalFile = path.join(studioRoot, 'pages/api/get-deployment-commit.ts')
      const originalSource = await readFile(originalFile, 'utf8')
      await writeFile(
        path.join(root, 'server.ts'),
        `import handler from ${JSON.stringify(originalFile)};\nexport default {fetch() {return new Response(handler.name)}};\n`
      )
      const generatedAppMaps: { fileName: string; code: string; map: SourceMap }[] = []
      const builder = await createBuilder({
        configFile: false,
        root,
        logLevel: 'silent',
        build: { sourcemap: config.environments.client.build.sourcemap },
        plugins: [
          serverSourceMaps(),
          {
            name: 'split-ssr-service-fixture',
            configEnvironment(name) {
              if (name !== 'ssr') return
              return {
                build: {
                  rolldownOptions: {
                    output: {
                      codeSplitting: {
                        groups: [{ name: 'api', test: (id) => id === originalFile }],
                      },
                    },
                  },
                },
              }
            },
          },
          nitro({
            ...nitroOptions,
            rootDir: root,
            preset: isVercel ? 'vercel' : 'node',
            traceDeps: [],
            modules: [],
            experimental: {
              ...nitroOptions.experimental,
              vite: { services: { ssr: { entry: path.join(root, 'server.ts') } } },
            },
          }),
          {
            name: 'capture-composed-server-map',
            applyToEnvironment: (environment) => environment.name === 'nitro',
            generateBundle(_options, bundle) {
              for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk' || !chunk.map) continue
                const map: SourceMap = JSON.parse(JSON.stringify(chunk.map))
                if (
                  map.sources.some((source) =>
                    source.endsWith('/pages/api/get-deployment-commit.ts')
                  )
                ) {
                  generatedAppMaps.push({ fileName: chunk.fileName, code: chunk.code, map })
                }
              }
            },
          },
          ...(hasMalformedMap
            ? [
                {
                  name: 'malformed-ssr-map-fixture',
                  applyToEnvironment: (environment: { name: string }) => environment.name === 'ssr',
                  async writeBundle() {
                    const maps = await mapFiles(
                      path.join(root, 'node_modules/.nitro/vite/services/ssr')
                    )
                    await Promise.all(maps.map((map) => writeFile(map, '{invalid map')))
                  },
                },
              ]
            : []),
          ...sentryForFinalOutputs({
            ...sentryOptions,
            telemetry: false,
            release: { name: 'source-map-test', create: false, finalize: false },
            sourcemaps: {
              ...sentryOptions.sourcemaps,
              // Exercise debug-ID injection and cleanup without any network upload.
              disable: hasInstrumentation ? 'disable-upload' : true,
              filesToDeleteAfterUpload: cleanupGlobs.map((glob) => glob.replace(studioRoot, root)),
            },
          }),
        ],
      })
      if (hasMalformedMap) {
        await expect(builder.buildApp()).rejects.toThrow(/JSON|parse|source.?map/i)
        return
      }
      await builder.buildApp()
      const serverDir = isVercel ? '.vercel/output/functions' : '.output/server'
      const publicDir = isVercel ? '.vercel/output/static' : '.output/public'
      const serverMaps = await mapFiles(path.join(root, serverDir))
      expect(generatedAppMaps.length).toBeGreaterThan(0)
      for (const { fileName, code, map } of generatedAppMaps) {
        const sourceIndex = map.sources.findIndex((source) =>
          source.endsWith('/pages/api/get-deployment-commit.ts')
        )
        expect(map.sourcesContent[sourceIndex]).toBe(originalSource)
        const marker = 'Failed to fetch commit details'
        const markerIndex = code.indexOf(marker)
        expect(markerIndex).toBeGreaterThan(-1)
        const beforeMarker = code.slice(0, markerIndex).split('\n')
        const position = originalPositionFor(new TraceMap(map), {
          line: beforeMarker.length,
          column: beforeMarker.at(-1)!.length,
        })
        expect(position.source).toBe(map.sources[sourceIndex])
        expect(position.line).toBe(
          originalSource.slice(0, originalSource.indexOf(marker)).split('\n').length
        )
        if (hasInstrumentation) {
          const finalFile = path.join(
            root,
            isVercel ? '.vercel/output/functions/__server.func' : '.output/server',
            fileName
          )
          const uploadDebugId = code.match(
            /sentry-dbid-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/
          )?.[1]
          expect(uploadDebugId).toBeDefined()
          const { stdout } = await execFileAsync(process.execPath, [
            '--input-type=module',
            '--eval',
            `
            import { createRequire } from 'node:module';
            const require = createRequire(${JSON.stringify(sentryRequire.resolve('@sentry/core'))});
            const { getFilenameToDebugIdMap } = require(${JSON.stringify(sentryRequire.resolve('@sentry/core'))});
            const { defaultStackParser } = require(${JSON.stringify(sentryRequire.resolve('@sentry/node'))});
            await import(${JSON.stringify(pathToFileURL(finalFile).href)});
            console.log(JSON.stringify(getFilenameToDebugIdMap(defaultStackParser)));
          `,
          ])
          const runtimeIds: Record<string, string> = JSON.parse(stdout)
          expect(runtimeIds[finalFile] ?? runtimeIds[pathToFileURL(finalFile).href]).toBe(
            uploadDebugId
          )
        }
      }
      if (hasInstrumentation) expect(serverMaps).toEqual([])
      else expect(serverMaps.length).toBeGreaterThan(0)
      expect(
        (await mapFiles(path.join(root, 'node_modules/.nitro/vite/services/ssr'))).length
      ).toBeGreaterThan(0)
      expect(await mapFiles(path.join(root, publicDir))).toEqual([])
    },
    30_000
  )
})
