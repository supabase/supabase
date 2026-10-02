import { vi } from 'vitest'

type FilesModule = typeof import('./files')

type MigrationFile = {
  id: number
  name: string
  hash: string
  sql: string
  contents: string
}

function createMigration(id: number, name = `migration-${id}`): MigrationFile {
  return {
    id,
    name,
    hash: `hash-${id}`,
    sql: `-- ${name}`,
    contents: `-- ${name}`,
  }
}

async function loadFilesModule(loadMigrationFiles = vi.fn()) {
  vi.resetModules()

  vi.doMock('postgres-migrations', () => ({
    loadMigrationFiles,
  }))

  vi.doMock('../../../config', () => ({
    getConfig: () => ({
      dbMigrationFreezeAt: undefined,
    }),
  }))

  const files = (await import('./files')) as FilesModule

  return {
    files,
    loadMigrationFiles,
  }
}

describe('loadMigrationFilesCached', () => {
  afterEach(() => {
    vi.doUnmock('postgres-migrations')
    vi.doUnmock('../../../config')
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('reuses the cached result for repeated calls to the same directory', async () => {
    const migrations = [createMigration(1)]
    const { files, loadMigrationFiles } = await loadFilesModule(
      vi.fn().mockResolvedValue(migrations)
    )

    await expect(files.loadMigrationFilesCached('./migrations/tenant')).resolves.toEqual(migrations)
    await expect(files.loadMigrationFilesCached('./migrations/tenant')).resolves.toEqual(migrations)

    expect(loadMigrationFiles).toHaveBeenCalledTimes(1)
    expect(loadMigrationFiles).toHaveBeenCalledWith('./migrations/tenant')
  })

  it('shares the same in-flight promise for concurrent callers', async () => {
    const migrations = [createMigration(1)]
    let resolve!: (value: MigrationFile[]) => void
    const pending = new Promise<MigrationFile[]>((innerResolve) => {
      resolve = innerResolve
    })
    const { files, loadMigrationFiles } = await loadFilesModule(vi.fn().mockReturnValue(pending))

    const firstLoad = files.loadMigrationFilesCached('./migrations/tenant')
    const secondLoad = files.loadMigrationFilesCached('./migrations/tenant')

    expect(loadMigrationFiles).toHaveBeenCalledTimes(1)

    resolve(migrations)

    await expect(Promise.all([firstLoad, secondLoad])).resolves.toEqual([migrations, migrations])
  })

  it('keeps separate cache entries per directory', async () => {
    const { files, loadMigrationFiles } = await loadFilesModule(
      vi
        .fn()
        .mockResolvedValueOnce([createMigration(1, 'tenant-migration')])
        .mockResolvedValueOnce([createMigration(1, 'multitenant-migration')])
    )

    await files.loadMigrationFilesCached('./migrations/tenant')
    await files.loadMigrationFilesCached('./migrations/multitenant')
    await files.loadMigrationFilesCached('./migrations/tenant')

    expect(loadMigrationFiles).toHaveBeenCalledTimes(2)
    expect(loadMigrationFiles.mock.calls).toEqual([
      ['./migrations/tenant'],
      ['./migrations/multitenant'],
    ])
  })
})
