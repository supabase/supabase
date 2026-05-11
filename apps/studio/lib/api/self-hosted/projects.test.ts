import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks (hoisted before all imports)
// ---------------------------------------------------------------------------

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
}))

vi.mock('node:fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
  readFileSync: vi.fn(),
}))

vi.mock('./constants', () => ({
  POSTGRES_HOST: 'db',
  POSTGRES_PORT: 5432,
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_DATABASE: 'postgres',
  POSTGRES_USER_READ_WRITE: 'supabase_admin',
  POSTGRES_USER_READ_ONLY: 'supabase_read_only_user',
}))

vi.mock('@/lib/api/apiHelpers', () => ({
  normalizeRefParam: vi.fn((ref: string | string[] | undefined) =>
    Array.isArray(ref) ? ref[0] : (ref ?? 'default')
  ),
}))

vi.mock('@/lib/constants/api', () => ({
  PROJECT_REST_URL: 'http://localhost:8000/rest/v1/',
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lib/api/self-hosted/projects', () => {
  beforeEach(() => {
    // Reset module registry on each test so _fileCache is wiped and fresh
    // imports pick up the latest env stubs.
    vi.resetModules()
    // restoreAllMocks restores any vi.spyOn overrides (e.g. IS_PLATFORM getter)
    // in addition to clearing call counts. clearAllMocks alone is insufficient.
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  // -------------------------------------------------------------------------
  // getProjects
  // -------------------------------------------------------------------------

  describe('getProjects', () => {
    it('returns one legacy project when SUPABASE_PROJECTS is not set', async () => {
      vi.unstubAllEnvs()
      const { getProjects } = await import('./projects')

      const projects = getProjects()

      expect(projects).toHaveLength(1)
      expect(projects[0].ref).toBe('default')
    })

    it('returns legacy project with env-var values', async () => {
      vi.stubEnv('DEFAULT_PROJECT_NAME', 'My Project')
      vi.stubEnv('DEFAULT_ORGANIZATION_NAME', 'My Org')
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key-123')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'svc-key-456')
      vi.stubEnv('AUTH_JWT_SECRET', 'jwt-secret-at-least-32-chars-long-yes')

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      expect(projects[0].name).toBe('My Project')
      expect(projects[0].organizationName).toBe('My Org')
      expect(projects[0].anonKey).toBe('anon-key-123')
      expect(projects[0].serviceKey).toBe('svc-key-456')
      expect(projects[0].jwtSecret).toBe('jwt-secret-at-least-32-chars-long-yes')
    })

    it('throws when IS_PLATFORM is true', async () => {
      const constants = await import('@/lib/constants')
      vi.spyOn(constants, 'IS_PLATFORM', 'get').mockReturnValue(true)

      const { getProjects } = await import('./projects')

      expect(() => getProjects()).toThrow('getProjects() can only be called in self-hosted environments')
    })

    it('parses SUPABASE_PROJECTS and returns all projects', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'alpha', name: 'Alpha', pgMetaUrl: 'http://meta-alpha:8080' },
          { ref: 'beta', name: 'Beta', pgMetaUrl: 'http://meta-beta:8080' },
        ])
      )

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      expect(projects).toHaveLength(2)
      expect(projects[0].ref).toBe('alpha')
      expect(projects[0].name).toBe('Alpha')
      expect(projects[0].pgMetaUrl).toBe('http://meta-alpha:8080')
      expect(projects[1].ref).toBe('beta')
      expect(projects[1].name).toBe('Beta')
    })

    it('assigns sequential stable numeric IDs to projects', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'p1', name: 'P1' },
          { ref: 'p2', name: 'P2' },
          { ref: 'p3', name: 'P3' },
        ])
      )

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      expect(projects[0].id).toBe(1)
      expect(projects[1].id).toBe(2)
      expect(projects[2].id).toBe(3)
    })

    it('falls back to legacy project on malformed SUPABASE_PROJECTS JSON', async () => {
      vi.stubEnv('SUPABASE_PROJECTS', 'not-valid-json{{')

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      expect(projects).toHaveLength(1)
      expect(projects[0].ref).toBe('default')
    })

    it('falls back to legacy project when SUPABASE_PROJECTS is an empty array', async () => {
      vi.stubEnv('SUPABASE_PROJECTS', '[]')

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      expect(projects).toHaveLength(1)
      expect(projects[0].ref).toBe('default')
    })
  })

  // -------------------------------------------------------------------------
  // getProject
  // -------------------------------------------------------------------------

  describe('getProject', () => {
    it('returns the project matching the given ref', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'moonlit', name: 'Moonlit', pgMetaUrl: 'http://meta-moonlit:8080' },
        ])
      )

      const { getProject } = await import('./projects')
      const project = getProject('moonlit')

      expect(project.ref).toBe('moonlit')
      expect(project.name).toBe('Moonlit')
    })

    it('returns the default legacy project when ref is "default"', async () => {
      const { getProject } = await import('./projects')
      const project = getProject('default')

      expect(project.ref).toBe('default')
    })

    it('throws a 404 error when the ref does not exist', async () => {
      const { getProject } = await import('./projects')

      expect(() => getProject('nonexistent')).toThrow("Project 'nonexistent' not found")
    })

    it('attaches statusCode 404 to the thrown error', async () => {
      const { getProject } = await import('./projects')

      let thrown: any
      try {
        getProject('does-not-exist')
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeDefined()
      expect(thrown.statusCode).toBe(404)
    })

    it('handles array ref (Next.js catch-all params)', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([{ ref: 'arr-ref', name: 'Arr' }])
      )

      const { getProject } = await import('./projects')
      const project = getProject(['arr-ref', 'extra'])

      expect(project.ref).toBe('arr-ref')
    })

    it('handles undefined ref — falls back to "default"', async () => {
      const { getProject } = await import('./projects')
      const project = getProject(undefined)

      expect(project.ref).toBe('default')
    })
  })

  // -------------------------------------------------------------------------
  // getPgMetaUrlByRef
  // -------------------------------------------------------------------------

  describe('getPgMetaUrlByRef', () => {
    it('returns the pgMetaUrl for the requested project', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'prod', pgMetaUrl: 'http://pg-meta-prod:8080' },
        ])
      )

      const { getPgMetaUrlByRef } = await import('./projects')

      expect(getPgMetaUrlByRef('prod')).toBe('http://pg-meta-prod:8080')
    })

    it('returns the legacy pg-meta URL when no projects are configured', async () => {
      vi.stubEnv('STUDIO_PG_META_URL', 'http://legacy-meta:9090')

      const { getPgMetaUrlByRef } = await import('./projects')

      expect(getPgMetaUrlByRef('default')).toBe('http://legacy-meta:9090')
    })

    it('throws for an unknown ref', async () => {
      const { getPgMetaUrlByRef } = await import('./projects')

      expect(() => getPgMetaUrlByRef('unknown')).toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // getProjectSettingsByRef
  // -------------------------------------------------------------------------

  describe('getProjectSettingsByRef', () => {
    it('returns settings with correct structure', async () => {
      const { getProjectSettingsByRef } = await import('./projects')
      const settings = getProjectSettingsByRef('default')

      expect(settings).toHaveProperty('app_config')
      expect(settings).toHaveProperty('service_api_keys')
      expect(settings).toHaveProperty('jwt_secret')
      expect(settings).toHaveProperty('ref', 'default')
      expect(settings).toHaveProperty('status', 'ACTIVE_HEALTHY')
    })

    it('populates service_api_keys with service_role and anon keys', async () => {
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'svc-key')
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key')

      const { getProjectSettingsByRef } = await import('./projects')
      const settings = getProjectSettingsByRef('default')

      expect(settings.service_api_keys).toHaveLength(2)
      const serviceKey = settings.service_api_keys.find((k) => k.tags === 'service_role')
      const anonKey = settings.service_api_keys.find((k) => k.tags === 'anon')
      expect(serviceKey?.api_key).toBe('svc-key')
      expect(anonKey?.api_key).toBe('anon-key')
    })

    it('derives app_config endpoint from publicSupabaseUrl', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          {
            ref: 'myproj',
            publicSupabaseUrl: 'https://myhost.example.com:9100',
          },
        ])
      )

      const { getProjectSettingsByRef } = await import('./projects')
      const settings = getProjectSettingsByRef('myproj')

      expect(settings.app_config?.endpoint).toBe('myhost.example.com:9100')
      expect(settings.app_config?.protocol).toBe('https')
    })

    it('sets correct jwt_secret from project config', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'jwt-proj', jwtSecret: 'my-custom-32-char-jwt-secret-here' },
        ])
      )

      const { getProjectSettingsByRef } = await import('./projects')
      const settings = getProjectSettingsByRef('jwt-proj')

      expect(settings.jwt_secret).toBe('my-custom-32-char-jwt-secret-here')
    })

    it('throws 404 for an unknown ref', async () => {
      const { getProjectSettingsByRef } = await import('./projects')

      let thrown: any
      try {
        getProjectSettingsByRef('ghost')
      } catch (e) {
        thrown = e
      }

      expect(thrown?.statusCode).toBe(404)
    })
  })

  // -------------------------------------------------------------------------
  // getOrganizations
  // -------------------------------------------------------------------------

  describe('getOrganizations', () => {
    it('returns one org for the default single-project setup', async () => {
      vi.stubEnv('DEFAULT_ORGANIZATION_NAME', 'Default Org')

      const { getOrganizations } = await import('./projects')
      const orgs = getOrganizations()

      expect(orgs).toHaveLength(1)
      expect(orgs[0].name).toBe('Default Org')
    })

    it('groups projects into distinct orgs by organizationName', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'a', organizationName: 'Org A' },
          { ref: 'b', organizationName: 'Org B' },
          { ref: 'c', organizationName: 'Org A' }, // same org as 'a'
        ])
      )

      const { getOrganizations } = await import('./projects')
      const orgs = getOrganizations()

      expect(orgs).toHaveLength(2)
      expect(orgs.map((o) => o.name)).toEqual(expect.arrayContaining(['Org A', 'Org B']))
    })

    it('assigns stable numeric IDs to orgs', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'x', organizationName: 'Org X' },
          { ref: 'y', organizationName: 'Org Y' },
        ])
      )

      const { getOrganizations } = await import('./projects')
      const orgs = getOrganizations()

      const ids = orgs.map((o) => o.id)
      expect(ids).toContain(1)
      expect(ids).toContain(2)
    })

    it('returns one org when all projects share the same organizationName', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          { ref: 'p1', organizationName: 'Shared Infra' },
          { ref: 'p2', organizationName: 'Shared Infra' },
        ])
      )

      const { getOrganizations } = await import('./projects')
      const orgs = getOrganizations()

      expect(orgs).toHaveLength(1)
      expect(orgs[0].name).toBe('Shared Infra')
    })
  })

  // -------------------------------------------------------------------------
  // SUPABASE_PROJECTS_FILE (file-based config)
  // -------------------------------------------------------------------------

  describe('SUPABASE_PROJECTS_FILE', () => {
    it('loads projects from a file when SUPABASE_PROJECTS_FILE is set', async () => {
      vi.stubEnv('SUPABASE_PROJECTS_FILE', '/config/projects.json')

      const fs = await import('node:fs')
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify([
          { ref: 'file-proj', name: 'From File', pgMetaUrl: 'http://file-meta:8080' },
        ])
      )

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      expect(projects).toHaveLength(1)
      expect(projects[0].ref).toBe('file-proj')
      expect(projects[0].pgMetaUrl).toBe('http://file-meta:8080')
    })

    it('falls back to legacy project when the file contains invalid JSON', async () => {
      vi.stubEnv('SUPABASE_PROJECTS_FILE', '/config/bad.json')

      const fs = await import('node:fs')
      vi.mocked(fs.default.readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file')
      })

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      // No stale cache → should fall back to legacy
      expect(projects).toHaveLength(1)
      expect(projects[0].ref).toBe('default')
    })

    it('SUPABASE_PROJECTS env var takes precedence over file', async () => {
      vi.stubEnv('SUPABASE_PROJECTS', JSON.stringify([{ ref: 'from-env', name: 'Env' }]))
      vi.stubEnv('SUPABASE_PROJECTS_FILE', '/config/projects.json')

      const fs = await import('node:fs')
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify([{ ref: 'from-file', name: 'File' }])
      )

      const { getProjects } = await import('./projects')
      const projects = getProjects()

      expect(projects[0].ref).toBe('from-env')
    })
  })

  // -------------------------------------------------------------------------
  // parseProjectEntry — defaults and overrides
  // -------------------------------------------------------------------------

  describe('parseProjectEntry defaults', () => {
    it('fills in postgres connection details from per-project config', async () => {
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([
          {
            ref: 'db-proj',
            postgresHost: 'my-db-host',
            postgresPort: 6543,
            postgresPassword: 'secret',
            postgresDb: 'mydb',
          },
        ])
      )

      const { getProject } = await import('./projects')
      const project = getProject('db-proj')

      expect(project.postgresHost).toBe('my-db-host')
      expect(project.postgresPort).toBe(6543)
      expect(project.postgresPassword).toBe('secret')
      expect(project.postgresDb).toBe('mydb')
    })

    it('falls back to POSTGRES_* env vars for missing project fields', async () => {
      vi.stubEnv('POSTGRES_HOST', 'env-db-host')
      vi.stubEnv('POSTGRES_PORT', '5433')
      vi.stubEnv(
        'SUPABASE_PROJECTS',
        JSON.stringify([{ ref: 'sparse', name: 'Sparse' }]) // no postgres fields
      )

      const { getProject } = await import('./projects')
      const project = getProject('sparse')

      expect(project.postgresHost).toBe('env-db-host')
      expect(project.postgresPort).toBe(5433)
    })

    it('sets default jwtSecret when not provided', async () => {
      vi.stubEnv('SUPABASE_PROJECTS', JSON.stringify([{ ref: 'no-jwt' }]))

      const { getProject } = await import('./projects')
      const project = getProject('no-jwt')

      expect(project.jwtSecret).toBe(
        'super-secret-jwt-token-with-at-least-32-characters-long'
      )
    })
  })
})
