import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildCatalog, type BySlugSection, type FamilyRegistry } from './reference-catalog'

vi.mock('common/enabled-features', () => ({
  isFeatureEnabled: vi.fn(() => ({})),
}))

const { isFeatureEnabled } = await import('common/enabled-features')

const REGISTRY: FamilyRegistry = {
  javascript: { libPath: 'javascript', versions: ['v2', 'v1'], type: 'sdk' },
  cli: { libPath: 'cli', versions: [], type: 'cli' },
  self_hosting_auth: { libPath: 'self-hosting-auth', versions: [], type: 'self-hosting' },
}

const section = (slug: string, overrides: Partial<BySlugSection> = {}): BySlugSection => ({
  id: slug,
  slug,
  type: 'function',
  ...overrides,
})

const intro = section('introduction', { type: 'markdown' })

const catalog = (
  data: Record<string, Record<string, BySlugSection>>,
  references: FamilyRegistry = REGISTRY
) =>
  buildCatalog({
    references,
    loadSectionsBySlug: async (libraryId, version) => {
      const sections = data[`${libraryId}.${version}`]
      return sections ? new Map(Object.entries(sections)) : undefined
    },
  })

describe('buildCatalog', () => {
  afterEach(() => {
    vi.mocked(isFeatureEnabled).mockReset()
  })

  it('maps unversioned and current-version URLs to one file, and indexes each family', async () => {
    const { manifest } = await catalog({
      'javascript.v2': { select: section('select') },
      'javascript.v1': { select: section('select') },
    })

    expect(manifest).toEqual({
      index: '_index',
      javascript: 'javascript/v2/_index',
      'javascript/v2': 'javascript/v2/_index',
      'javascript/v1': 'javascript/v1/_index',
      'javascript/select': 'javascript/v2/select',
      'javascript/v2/select': 'javascript/v2/select',
      'javascript/v1/select': 'javascript/v1/select',
    })
  })

  it('aliases start to the introduction unless a real start section exists', async () => {
    const { manifest } = await catalog({
      'javascript.v2': { introduction: intro, start: section('start', { type: 'markdown' }) },
      'javascript.v1': { introduction: intro },
      'cli.latest': { login: section('login', { type: 'cli-command' }) },
    })

    expect(manifest['javascript/start']).toBe('javascript/v2/start')
    expect(manifest['javascript/v1/start']).toBe('javascript/v1/introduction')
    expect(manifest['cli/start']).toBeUndefined()
  })

  it('keeps the source id when it differs from the slug', async () => {
    const { entries } = await catalog({
      'cli.latest': {
        'role-connections': section('role-connections', { id: 'role-stats', type: 'cli-command' }),
      },
    })

    expect(entries[0]).toMatchObject({ slug: 'role-connections', sourceId: 'role-stats' })
  })

  it('leaves out function sections that have no function entry', async () => {
    const { entries } = await buildCatalog({
      references: REGISTRY,
      loadFunctionIds: async () => new Set(['select']),
      loadSectionsBySlug: async (_libraryId, version) =>
        version === 'v2'
          ? new Map(
              Object.entries({
                database: { type: 'category', title: 'Database' },
                select: section('select'),
                'auth-mfa-recovery-codes': section('auth-mfa-recovery-codes'),
                introduction: intro,
              })
            )
          : undefined,
    })

    expect(entries.map((entry) => entry.slug)).toEqual(['select', 'introduction'])
  })

  it('gives unversioned families no version segment and uses the hyphenated libPath', async () => {
    const { manifest } = await catalog({ 'self_hosting_auth.latest': { introduction: intro } })

    expect(manifest).toEqual({
      index: '_index',
      'self-hosting-auth': 'self-hosting-auth/latest/_index',
      'self-hosting-auth/introduction': 'self-hosting-auth/latest/introduction',
      'self-hosting-auth/start': 'self-hosting-auth/latest/introduction',
    })
  })

  it('skips disabled families', async () => {
    const { manifest } = await catalog(
      { 'cli.latest': { introduction: intro } },
      { cli: { ...REGISTRY.cli, enabled: false } }
    )

    expect(manifest).toEqual({})
  })

  it('skips auth sections when sdk:auth is off', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false)

    const { manifest } = await catalog({
      'javascript.v2': {
        select: section('select', { product: 'database' }),
        'auth-signup': section('auth-signup', { product: 'auth' }),
      },
    })

    expect(manifest['javascript/select']).toBeDefined()
    expect(manifest['javascript/auth-signup']).toBeUndefined()
  })

  it("leaves out an old version's prose section that has no file of its own, and keeps the current one", async () => {
    const { manifest } = await buildCatalog({
      references: REGISTRY,
      hasProse: async (entry) => entry.version === 'v2',
      loadSectionsBySlug: async () =>
        new Map(Object.entries({ installing: section('installing', { type: 'markdown' }) })),
    })

    expect(manifest['javascript/installing']).toBe('javascript/v2/installing')
    expect(manifest['javascript/v1/installing']).toBeUndefined()
  })

  it('throws when two families claim the same public path', async () => {
    const api = { libPath: 'api', versions: [], type: 'api' }

    await expect(
      catalog(
        { 'api.latest': { introduction: intro }, 'api_copy.latest': { introduction: intro } },
        { api, api_copy: api }
      )
    ).rejects.toThrow(/Conflicting reference sections .*api@latest:introduction/)
  })
})
