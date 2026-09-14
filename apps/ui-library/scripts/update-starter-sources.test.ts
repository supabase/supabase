import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { starterSources, type StarterSourceSnapshot } from '../config/starter-sources'
import { createStarterSnapshot, includeStarterSourceFile } from './update-starter-sources'

describe('starter source snapshots', () => {
  it('selects route, function, and schema inputs without vendoring unrelated template files', () => {
    for (const file of [
      'app/page.tsx',
      'app/(auth)/sign-in/page.tsx',
      'src/app/api/chat/route.ts',
      'pages/api/webhooks.ts',
      'supabase/functions/mcp-server/index.ts',
      'supabase/functions/_shared/auth.ts',
      'supabase/migrations/20260101000000_init.sql',
      'supabase/schemas/public/profiles.sql',
      'supabase/config.toml',
    ]) {
      assert.equal(includeStarterSourceFile(file, 'nextjs'), true, file)
    }
    for (const file of [
      'app/layout.tsx',
      'app/globals.css',
      'app/opengraph-image.png',
      'components/chat.tsx',
      'node_modules/example/pages/index.tsx',
      'supabase/seed.sql',
      'package.json',
      'README.md',
    ]) {
      assert.equal(includeStarterSourceFile(file, 'nextjs'), false, file)
    }
    assert.equal(includeStarterSourceFile('lib/pages/splash_page.dart', 'flutter'), true)
    assert.equal(includeStarterSourceFile('lib/components/avatar.dart', 'flutter'), false)
    assert.equal(includeStarterSourceFile('app/page.tsx', 'flutter'), false)
  })

  it('keeps exact SQL and config text while stripping route source and producing deterministic output', () => {
    const source = starterSources[0]
    const revision = 'a'.repeat(40)
    const files = [
      { path: 'supabase/migrations/init.sql', content: 'create table public.widgets (id uuid);\n' },
      { path: 'app/page.tsx', content: 'export default function Page() {}' },
      { path: 'supabase/config.toml', content: '[functions.example]\nverify_jwt = false\n' },
      { path: 'public/preview.png', content: 'irrelevant' },
    ]
    const snapshot = createStarterSnapshot(source, revision, files)
    assert.deepEqual(createStarterSnapshot(source, revision, [...files].reverse()), snapshot)
    assert.deepEqual(snapshot.files[0], { path: 'app/page.tsx' })
    assert.equal(snapshot.files[1].content, files[2].content)
    assert.equal(snapshot.files[2].content, files[0].content)
    assert.equal(
      snapshot.source.treeUrl,
      `https://github.com/${source.repository}/tree/${revision}`
    )
    assert.throws(() => createStarterSnapshot(source, 'main', files), /Invalid revision/)
    assert.throws(
      () => createStarterSnapshot(source, revision, [{ path: 'supabase/migrations/init.sql' }]),
      /missing content/
    )
    assert.throws(() => createStarterSnapshot(source, revision, []), /No architecture source files/)
  })

  it('ships a pinned source snapshot for every descriptor with the inputs needed for analysis', () => {
    for (const descriptor of starterSources) {
      const snapshot: StarterSourceSnapshot = JSON.parse(
        readFileSync(
          new URL(`../registry/starter-sources/${descriptor.name}.json`, import.meta.url),
          'utf8'
        )
      )
      assert.equal(snapshot.name, descriptor.name)
      assert.equal(snapshot.framework, descriptor.framework)
      assert.equal(snapshot.source.repository, descriptor.repository)
      assert.equal(snapshot.source.root, descriptor.root)
      assert.match(snapshot.source.revision, /^[a-f0-9]{40}$/)
      assert.deepEqual(
        snapshot,
        createStarterSnapshot(descriptor, snapshot.source.revision, snapshot.files)
      )
      assert.ok(snapshot.files.some((file) => file.path.endsWith('.sql') && file.content))
      assert.ok(snapshot.files.some((file) => file.path === 'supabase/config.toml' && file.content))
      assert.ok(snapshot.files.some((file) => /(?:page\.[jt]sx?|_page\.dart)$/.test(file.path)))
    }
  })
})
