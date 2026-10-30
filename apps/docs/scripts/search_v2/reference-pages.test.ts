import { describe, expect, it, vi } from 'vitest'

import {
  ClientLibReferenceSource,
  CliReferenceSource,
  OpenApiReferenceSource,
} from '../search/sources/reference-doc'
import {
  buildReferenceRows,
  cleanMethodName,
  splitIdentifier,
  toSectionRow,
  type Reference,
} from './reference-pages'

// the generated data is not in the repo: the sections each page renders are fixtures
vi.mock('../../features/docs/Reference.generated.singleton.js', () => ({
  getApiEndpointById: vi.fn(),
  getFlattenedSections: vi.fn(),
}))
const singleton = vi.mocked(await import('../../features/docs/Reference.generated.singleton.js'))

const csharp = { id: 'csharp', version: 'v8', title: 'C# Reference' }

const csharpSignUp = new ClientLibReferenceSource(
  'csharp-lib',
  '/reference/csharp/auth-signup',
  {
    id: 'sign-up',
    type: 'function',
    title: 'Create a new user',
    slug: 'auth-signup',
    product: 'auth',
  },
  { id: 'sign-up', $ref: '', title: 'SignUp()', description: 'Creates a new user.' },
  { title: 'C# Reference' }
)

describe('splitIdentifier', () => {
  it('splits camelCase, snake_case and dotted names into words', () => {
    expect(splitIdentifier('signInWithPassword')).toBe('sign In With Password')
    expect(splitIdentifier('sign_in_with_password')).toBe('sign in with password')
    expect(splitIdentifier('Operator.Equals')).toBe('Operator Equals')
  })
})

describe('cleanMethodName', () => {
  it('keeps the method, drops the signature and the label', () => {
    expect(cleanMethodName('SignUp()')).toBe('SignUp')
    expect(cleanMethodName('SignIn(email, password)')).toBe('SignIn')
    expect(cleanMethodName('Fetch data: select()')).toBe('select')
    expect(cleanMethodName('from_.upload()')).toBe('from_.upload')
    expect(cleanMethodName('Using Filters')).toBeUndefined()
  })
})

describe('toSectionRow', () => {
  it('names legacy SDK sections after the method, titled for humans', () => {
    expect(toSectionRow({ ...csharp, load: vi.fn() }, csharpSignUp)).toMatchObject({
      slug: 'reference/csharp/auth-signup',
      page_title: 'SignUp',
      heading: 'SignUp Create a new user',
      heading_level: 1,
      heading_path: ['C# Reference', 'SignUp'],
      excerpt: 'Create a new user',
    })
  })

  it('names new pipeline sections after their title, the method', () => {
    const source = new ClientLibReferenceSource(
      'js-lib',
      '/reference/javascript/auth-getclaims',
      {
        id: 'auth-getclaims',
        type: 'function',
        title: 'getClaims',
        slug: 'auth-getclaims',
        product: 'auth',
      },
      {
        id: 'auth-getclaims',
        $ref: '',
        title: '',
        description: 'Extracts the JWT claims. Verifies the [JWT](/docs/guides/auth/jwts) first.',
      },
      { title: 'JavaScript Reference' }
    )
    const reference = { id: 'javascript', version: 'v2', title: 'JavaScript Reference' }
    const row = toSectionRow({ ...reference, load: vi.fn() }, source)

    expect(row).toMatchObject({ page_title: 'getClaims', heading: 'getClaims' })
    expect(row.excerpt).toBe('Extracts the JWT claims.')
    expect(row.content).toContain('get Claims')
    expect(row.content).toContain('Verifies the JWT first.')
  })

  it('names CLI sections after the command', () => {
    const source = new CliReferenceSource(
      'cli',
      '/reference/cli/supabase-db-push',
      {
        id: 'supabase-db-push',
        type: 'cli-command',
        title: 'Push migration to remote database',
        slug: 'supabase-db-push',
      },
      {
        id: 'supabase-db-push',
        title: 'supabase db push',
        summary: 'Push new migrations to the remote database',
      } as never,
      { title: 'CLI Reference' }
    )
    const reference = { id: 'cli', version: 'latest', title: 'CLI Reference' }

    expect(toSectionRow({ ...reference, load: vi.fn() }, source)).toMatchObject({
      page_title: 'supabase db push',
      heading: 'supabase db push Push migration to remote database',
      excerpt: 'Push migration to remote database',
    })
  })

  it('describes Management API sections by their endpoint', () => {
    const source = new OpenApiReferenceSource(
      'api',
      '/reference/api/v1-list-all-projects',
      {
        id: 'v1-list-all-projects',
        type: 'operation',
        title: 'List all projects',
        slug: 'v1-list-all-projects',
      },
      { operation: 'get', path: '/v1/projects', description: 'Returns a list of all projects.' },
      { title: 'Management API Reference' }
    )
    const reference = { id: 'api', version: 'latest', title: 'Management API Reference' }

    expect(toSectionRow({ ...reference, load: vi.fn() }, source)).toMatchObject({
      page_title: 'List all projects',
      heading: 'List all projects',
      excerpt: 'GET /v1/projects: Returns a list of all projects.',
    })
  })
})

describe('buildReferenceRows', () => {
  it('adds the page and keeps one row per section the page renders', async () => {
    const mfaEnroll = new ClientLibReferenceSource(
      'csharp-lib',
      '/reference/csharp/auth-mfa-enroll',
      {
        id: 'mfa-enroll',
        type: 'function',
        title: 'Enroll a factor',
        slug: 'auth-mfa-enroll',
        product: 'auth',
      },
      { id: 'mfa-enroll', $ref: '', title: 'Enroll()', description: '' },
      { title: 'C# Reference' }
    )
    singleton.getFlattenedSections.mockResolvedValue([
      { id: 'introduction', type: 'markdown', slug: 'introduction' },
      { id: 'sign-up', type: 'function', slug: 'auth-signup' },
    ])
    const reference: Reference = {
      ...csharp,
      load: async () => [csharpSignUp, csharpSignUp, mfaEnroll],
    }

    const rows = await buildReferenceRows(reference)

    expect(rows.map((row) => row.slug)).toEqual([
      'reference/csharp',
      'reference/csharp/auth-signup',
    ])
    expect(rows[0]).toMatchObject({ page_title: 'C# Reference', heading_path: ['C# Reference'] })
    expect(rows[0].excerpt).toMatch(/^This reference documents every object and method/)
  })

  it('fails when the generated data is missing', async () => {
    singleton.getFlattenedSections.mockResolvedValue([])
    await expect(
      buildReferenceRows({ ...csharp, load: async () => [csharpSignUp] })
    ).rejects.toThrow('codegen:references')
  })
})
