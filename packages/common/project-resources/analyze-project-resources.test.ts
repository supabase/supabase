import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { analyzeProjectResources, type ProjectFile, type ProjectFramework } from './index'

const file = (path: string, content?: string): ProjectFile => ({ path, content })
const sql = (content: string, name = '001_initial.sql') =>
  file(`supabase/migrations/${name}`, content)
const route = (path: string, component = true, server = false) => `
  import { createFileRoute } from '@tanstack/react-router'
  export const Route = createFileRoute('${path}')({
    ${component ? 'component: Page,' : ''}
    ${server ? 'server: { handlers: { GET: () => new Response() } },' : ''}
    loader: async () => null,
  })
`

describe('project table resources', () => {
  it('finds only profiles in the real Flutter migration, not referenced auth or Storage tables', async () => {
    const content = readFileSync(
      new URL(
        '../../../examples/user-management/flutter-user-management/supabase/migrations/20240404030631_init.sql',
        import.meta.url
      ),
      'utf8'
    )
    const result = await analyzeProjectResources([sql(content)], { framework: 'flutter' })
    assert.deepEqual(
      result.resources.map(({ kind, schema, name }) => ({ kind, schema, name })),
      [{ kind: 'table', schema: 'public', name: 'profiles' }]
    )
    assert.deepEqual(result.diagnostics, [])
  })

  it('uses Postgres identifiers for qualified, quoted, CTAS, and nested schema table declarations', async () => {
    const result = await analyzeProjectResources([
      sql(`
      CREATE TABLE IF NOT EXISTS public.users (id int);
      CREATE UNLOGGED TABLE "Reports"."Monthly Totals" AS SELECT 1 AS total;
      CREATE SCHEMA sales CREATE TABLE orders (id int);
      CREATE TABLE public."a.b" (id int);
      CREATE TABLE "public.a".b (id int);
      CREATE TEMP TABLE scratch (id int);
      CREATE MATERIALIZED VIEW counts AS SELECT 1;
    `),
    ])
    assert.deepEqual(
      result.resources.map(({ schema, name }) => [schema, name]).sort(),
      [
        ['Reports', 'Monthly Totals'],
        ['public', 'a.b'],
        ['public', 'users'],
        ['public.a', 'b'],
        ['sales', 'orders'],
      ].sort()
    )
    assert.equal(new Set(result.resources.map((resource) => resource.id)).size, 5)
  })

  it('ignores comments, policies, references, function bodies, and SQL outside schema sources', async () => {
    const result = await analyzeProjectResources([
      sql(`
        -- CREATE TABLE bogus (id int);
        /* CREATE TABLE also_bogus (id int); */
        CREATE TABLE public.items (id uuid REFERENCES auth.users);
        CREATE POLICY "Create table imaginary" ON storage.objects FOR SELECT USING (true);
        CREATE FUNCTION public.make_stuff() RETURNS void AS $$ BEGIN EXECUTE 'CREATE TABLE hidden (id int)'; END; $$ LANGUAGE plpgsql;
        SELECT 'CREATE TABLE text_only (id int)';
      `),
      file('supabase/seed.sql', 'CREATE TABLE seed_only (id int);'),
      file('docs/example.sql', 'CREATE TABLE example_only (id int);'),
      file('src/database-types.ts', 'export type Tables = { fake: unknown }'),
    ])
    assert.deepEqual(
      result.resources.map((resource) => resource.name),
      ['items']
    )
  })

  it('applies later drops, renames and schema moves without adding altered pre-existing tables', async () => {
    const result = await analyzeProjectResources([
      sql(
        'ALTER TABLE public.original RENAME TO renamed; ALTER TABLE renamed SET SCHEMA private; DROP TABLE public.removed; ALTER TABLE auth.users RENAME TO people;',
        '003_change.sql'
      ),
      sql(
        'CREATE TABLE public.original (id int); CREATE TABLE removed (id int);',
        '001_create.sql'
      ),
      sql('ALTER TABLE public.original ADD COLUMN label text;', '002_alter.sql'),
    ])
    assert.deepEqual(
      result.resources.map(({ name, schema, files }) => ({ name, schema, files })),
      [
        {
          name: 'renamed',
          schema: 'private',
          files: ['supabase/migrations/001_create.sql', 'supabase/migrations/003_change.sql'],
        },
      ]
    )
  })

  it('deduplicates migration and declarative schema declarations and supports static search_path', async () => {
    const result = await analyzeProjectResources([
      file('supabase/schemas/tables.sql', 'CREATE TABLE public.items(id int);'),
      sql(
        'CREATE TABLE public.items(id int); SET search_path TO private, public; CREATE TABLE notes(id int);'
      ),
    ])
    assert.equal(result.resources.length, 2)
    assert.equal(result.resources.find((resource) => resource.name === 'notes')?.schema, 'private')
    assert.equal(result.resources.find((resource) => resource.name === 'items')?.files.length, 2)
  })

  it('restores known tables on transaction rollback and resets a local search_path at commit', async () => {
    const result = await analyzeProjectResources([
      sql(`
      CREATE TABLE keep(id int);
      BEGIN;
      DROP TABLE keep;
      CREATE TABLE rolled_back(id int);
      ROLLBACK;
      BEGIN;
      SET LOCAL search_path TO private;
      CREATE TABLE notes(id int);
      COMMIT;
      SELECT 1 AS id INTO selected;
    `),
    ])
    assert.deepEqual(
      result.resources.map(({ schema, name }) => [schema, name]),
      [
        ['private', 'notes'],
        ['public', 'keep'],
        ['public', 'selected'],
      ]
    )
    assert.deepEqual(result.diagnostics, [])
  })

  it('reports missing/invalid SQL and runtime-dependent statements without fabricating tables', async () => {
    const result = await analyzeProjectResources([
      sql('CREATE TABLE broken (', '001_broken.sql'),
      file('supabase/schemas/missing.sql'),
      sql(
        `DO $$ BEGIN EXECUTE 'CREATE TABLE dynamic_table (id int)'; END $$; SET search_path TO "$user", public; CREATE TABLE uncertain(id int);`,
        '002_dynamic.sql'
      ),
    ])
    assert.deepEqual(result.resources, [])
    assert.deepEqual(
      new Set(result.diagnostics.map((diagnostic) => diagnostic.code)),
      new Set(['invalid-sql', 'missing-content', 'unsupported-sql', 'ambiguous-schema'])
    )
  })
})

describe('Edge Function resources', () => {
  it('requires index.ts and groups implementation files while excluding shared/test folders', async () => {
    const result = await analyzeProjectResources([
      file('supabase/functions/payments/index.ts'),
      file('supabase/functions/payments/utils.ts'),
      file('supabase/functions/payments/deno.json'),
      file('supabase/functions/payments/README.md'),
      file('supabase/functions/payments/index.test.ts'),
      file('supabase/functions/payments/tests/fixture.ts'),
      file('supabase/functions/_shared/index.ts'),
      file('supabase/functions/tests/index.ts'),
      file('supabase/functions/not-a-function/helper.ts'),
    ])
    assert.deepEqual(result.resources, [
      {
        id: 'edge-function:payments',
        kind: 'edge-function',
        name: 'payments',
        files: [
          'supabase/functions/payments/deno.json',
          'supabase/functions/payments/index.ts',
          'supabase/functions/payments/utils.ts',
        ],
      },
    ])
    assert.equal(result.diagnostics[0]?.code, 'missing-function-entrypoint')
  })

  it('uses real TOML configuration for custom entrypoints and disabled functions', async () => {
    const result = await analyzeProjectResources([
      file(
        'supabase/config.toml',
        `
        [functions."send-email"]
        entrypoint = './functions/send-email/main.js' # config-relative
        [functions.disabled]
        enabled = false
        [functions.missing]
        entrypoint = './functions/missing/start.ts'
      `
      ),
      file('supabase/functions/send-email/main.js'),
      file('supabase/functions/send-email/helper.ts'),
      file('supabase/functions/disabled/index.ts'),
    ])
    assert.deepEqual(
      result.resources.map((resource) => resource.name),
      ['send-email']
    )
    assert.equal(result.diagnostics.length, 1)
    assert.equal(result.diagnostics[0].code, 'missing-function-entrypoint')
  })

  it('reports malformed configuration and rejects traversal in custom entrypoints', async () => {
    const invalid = await analyzeProjectResources([
      file('supabase/config.toml', '[functions.bad'),
      file('supabase/functions/default/index.ts'),
    ])
    assert.deepEqual(invalid.resources, [])
    assert.equal(invalid.diagnostics[0]?.code, 'invalid-function-config')
    const traversal = await analyzeProjectResources([
      file('supabase/config.toml', '[functions.bad]\nentrypoint = "../../outside.ts"'),
    ])
    assert.deepEqual(traversal.resources, [])
    assert.equal(traversal.diagnostics[0]?.code, 'missing-function-entrypoint')
  })
})

describe('application route resources', () => {
  it('identifies Next app/pages routes and ignores infrastructure, slots, private and test files', async () => {
    const result = await analyzeProjectResources(
      [
        ...[
          'src/app/(marketing)/page.tsx',
          'src/app/users/[id]/page.tsx',
          'src/app/api/chat/route.ts',
          'src/app/layout.tsx',
          'src/app/error.tsx',
          'src/app/_private/page.tsx',
          'src/app/@modal/page.tsx',
          'src/app/(.)photos/[id]/page.tsx',
          'src/app/page.test.tsx',
          'pages/about.tsx',
          'pages/index.tsx',
          'pages/api/items/[...slug].ts',
          'pages/_app.tsx',
          'pages/_document.tsx',
        ].map((path) => file(path)),
      ],
      { framework: 'nextjs' }
    )
    assert.deepEqual(
      result.resources.map(({ kind, route }) => [kind, route]),
      [
        ['api-route', '/api/chat'],
        ['api-route', '/api/items/:slug*'],
        ['page', '/'],
        ['page', '/about'],
        ['page', '/users/:id'],
      ]
    )
    assert.equal(result.resources.find((resource) => resource.route === '/')?.files.length, 2)
  })

  it('identifies Nuxt pages and server methods without treating middleware or composables as routes', async () => {
    const result = await analyzeProjectResources(
      [
        ...[
          'app/pages/index.vue',
          'app/pages/users/[id].vue',
          'pages/account/index.vue',
          'server/api/profile.get.ts',
          'server/api/profile.post.ts',
          'server/routes/health.get.ts',
          'server/middleware/auth.ts',
          'app/composables/useProfile.ts',
          'app/layouts/default.vue',
        ].map((path) => file(path)),
      ],
      { framework: 'nuxt' }
    )
    assert.deepEqual(
      result.resources.map(({ kind, route }) => [kind, route]),
      [
        ['api-route', '/api/profile'],
        ['api-route', '/health'],
        ['page', '/'],
        ['page', '/account'],
        ['page', '/users/:id'],
      ]
    )
    assert.equal(result.resources[0].files.length, 2)
  })

  it('distinguishes TanStack components and server routes from root/layout/loader-only files', async () => {
    const result = await analyzeProjectResources(
      [
        file('routes/users.$id.tsx', route('/users/$id')),
        file('routes/_app.dashboard.tsx', route('/_app/dashboard')),
        file('routes/api.chat.ts', route('/api/chat', false, true)),
        file('routes/mixed.tsx', route('/mixed', true, true)),
        file('routes/__root.tsx', route('/', true)),
        file('routes/_app.tsx', route('/_app', true)),
        file('routes/confirm.ts', route('/confirm', false)),
        file('routes/-components/card.tsx', route('/fake')),
        file('routeTree.gen.ts', route('/fake')),
      ],
      { framework: 'tanstack' }
    )
    assert.deepEqual(
      result.resources.map(({ kind, route }) => [kind, route]),
      [
        ['api-route', '/api/chat'],
        ['api-route', '/mixed'],
        ['page', '/dashboard'],
        ['page', '/mixed'],
        ['page', '/users/:id'],
      ]
    )
    assert.equal(result.diagnostics.length, 1)
    assert.match(result.diagnostics[0].message, /loader alone/)
  })

  it('uses React Router exports to distinguish default pages from loader/action-only resource routes', async () => {
    const result = await analyzeProjectResources(
      [
        file('app/routes/_index.tsx', 'export default function Home() {}'),
        file(
          'app/routes/_auth.login.tsx',
          'export { Login as default }; export async function loader() {}'
        ),
        file('app/routes/api.users.$id.ts', 'export async function loader() {}'),
        file('app/routes/upload.ts', 'export const action = async () => null'),
        file('app/routes/_auth.tsx', 'export default function Layout() {}'),
        file(
          'app/routes/unclassified.tsx',
          'const code = "export default Card"; // export function loader() {}'
        ),
        file('app/routes/projects/route.tsx', 'export default function Projects() {}'),
        file('app/routes/projects/card.tsx', 'export default function Card() {}'),
        file('app/routes/projects/helpers/route.tsx', 'export default function Helper() {}'),
        file('app/routes.ts', 'export default flatRoutes()'),
      ],
      { framework: 'react-router' }
    )
    assert.deepEqual(
      result.resources.map(({ kind, route }) => [kind, route]),
      [
        ['api-route', '/api/users/:id'],
        ['api-route', '/upload'],
        ['page', '/'],
        ['page', '/login'],
        ['page', '/projects'],
      ]
    )
    assert.equal(result.diagnostics.length, 1)
  })

  it('does not classify strings, comments, regular expressions or nested functions as module exports', async () => {
    const result = await analyzeProjectResources(
      [
        file(
          'app/routes/fake.ts',
          `const text = 'export default Page'; const re = /export default/; function run() { const loader = () => {}; } /* export const action = fn */`
        ),
        file(
          'routes/fake.tsx',
          `const fake = "export const Route = createFileRoute('/fake')({component: Page})"`
        ),
      ],
      { framework: 'generic' }
    )
    assert.deepEqual(result.resources, [])
    assert.equal(result.diagnostics.length, 2)
  })

  it('uses Flutter page files as screens without inventing URL routes', async () => {
    const result = await analyzeProjectResources(
      [
        file('lib/pages/login_page.dart'),
        file('lib/pages/account_page.dart'),
        file('lib/components/avatar.dart'),
        file('lib/main.dart'),
        file('test/pages/login_page_test.dart'),
      ],
      { framework: 'flutter' }
    )
    assert.deepEqual(
      result.resources.map((resource) => resource.name),
      ['account_page', 'login_page']
    )
    assert.ok(result.resources.every((resource) => resource.route === undefined))
  })

  it('reports missing route content instead of guessing TanStack or React Router behavior', async () => {
    for (const framework of ['tanstack', 'react-router'] as ProjectFramework[]) {
      const result = await analyzeProjectResources([file('routes/users.tsx')], { framework })
      assert.deepEqual(result.resources, [])
      assert.equal(result.diagnostics[0].code, 'missing-content')
    }
  })
})

describe('analysis input and determinism', () => {
  it('normalizes duplicate paths, prefers supplied content, and has stable ordering without mutating inputs', async () => {
    const files = [
      file('./supabase/migrations/001.sql'),
      sql('CREATE TABLE things(id int);', '001.sql'),
      file('src\\app\\page.tsx'),
      file('src/app/page.tsx'),
    ]
    const before = JSON.stringify(files)
    const first = await analyzeProjectResources(files, { framework: 'nextjs' })
    assert.deepEqual(
      first,
      await analyzeProjectResources([...files].reverse(), { framework: 'nextjs' })
    )
    assert.equal(first.resources.length, 2)
    assert.equal(JSON.stringify(files), before)
  })

  it('returns diagnostics for conflicting contents, invalid paths, invalid framework and invalid file input', async () => {
    const result = await analyzeProjectResources([
      sql('CREATE TABLE a(id int);'),
      sql('CREATE TABLE b(id int);'),
      file('/absolute/app/page.tsx'),
      file('../app/page.tsx'),
      file('C:\\app\\page.tsx'),
      { path: 'app/page.tsx', content: 123 } as unknown as ProjectFile,
      null as unknown as ProjectFile,
    ])
    assert.deepEqual(result.resources, [])
    assert.equal(
      result.diagnostics.filter((diagnostic) => diagnostic.code === 'conflicting-file').length,
      1
    )
    assert.equal(
      result.diagnostics.filter((diagnostic) => diagnostic.code === 'invalid-input').length,
      5
    )
    assert.equal(
      (await analyzeProjectResources(null as unknown as ProjectFile[])).diagnostics[0].code,
      'invalid-input'
    )
    assert.equal(
      (await analyzeProjectResources([], { framework: 'invalid' as ProjectFramework }))
        .diagnostics[0].code,
      'invalid-input'
    )
  })
})
