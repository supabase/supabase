import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { collectMdxFiles, getDocSlug } from './library-documents'
import { transformLibraryMdx } from './library-mdx-to-markdown'

describe('transformLibraryMdx', () => {
  it('exports ordered install instructions and setup notes from the MDX body', () => {
    const source = readFileSync(
      new URL('../content/docs/starters/nextjs-starter.mdx', import.meta.url),
      'utf8'
    )
    const output = transformLibraryMdx(source)
    assert.equal(output.match(/^## Installation$/gm)?.length, 1)
    assert.match(output, /cd my-app\nnpx shadcn@latest init --base radix/)
    assert.ok(output.indexOf('npx create-next-app') < output.indexOf('npx shadcn@latest add'))
    assert.ok(output.indexOf('npx shadcn@latest add') < output.indexOf('## Configure Supabase'))
    assert.match(output, /Keep the generated package lockfile/)
    assert.doesNotMatch(output, /<BlockItem|<BlockOverview/)
  })

  it('preserves the file tree and source when folder structure moves into the preview tabs', () => {
    const source = readFileSync(
      new URL('../content/docs/headless/mcp-server.mdx', import.meta.url),
      'utf8'
    )
    const output = transformLibraryMdx(source)
    assert.match(output, /## Files/)
    assert.match(output, /`supabase\//)
    assert.match(output, /`index\.ts`/)
    assert.match(output, /Full source: https:\/\/supabase\.com\/library\/r\/mcp-server\.json/)
    assert.doesNotMatch(output, /RegistryBlock|BlockOverview|## Folder structure/)
    assert.match(output, /## Configure the project/)
  })
  it('preserves every framework quickstart in the agent-readable Markdown', () => {
    const source = readFileSync(
      new URL('../content/docs/getting-started/quickstart.mdx', import.meta.url),
      'utf8'
    )
    const output = transformLibraryMdx(source)

    for (const framework of ['nextjs', 'react-router', 'tanstack', 'react', 'vue', 'nuxtjs']) {
      assert.ok(output.includes(`/supabase-client-${framework}.json`))
      assert.ok(output.includes(`/password-based-auth-${framework}.json`))
    }
    for (const title of [
      'Next.js',
      'React Router',
      'TanStack Start',
      'React SPA',
      'Vue',
      'Nuxt.js',
    ]) {
      assert.ok(output.includes(`## ${title}`))
    }
    assert.equal(output.match(/init --template/g)?.length, 6)
    assert.equal(output.match(/npm run dev/g)?.length, 6)
    assert.match(output, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/)
    assert.match(output, /VITE_SUPABASE_PUBLISHABLE_KEY/)
    assert.match(output, /NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/)
    assert.doesNotMatch(output, /FrameworkQuickstart|QuickstartStep/)
  })

  it('lifts title and description into a markdown header', () => {
    const output = transformLibraryMdx(`---
title: Password-based Authentication
description: Password-based authentication block for Next.js
---

Hello world.
`)

    assert.match(
      output,
      /^# Password-based Authentication\n\nPassword-based authentication block for Next.js\n\nHello world.\n$/
    )
  })

  it('replaces BlockItem with a production shadcn install command', () => {
    const output = transformLibraryMdx(`---
title: Auth
description: Auth block
---

<BlockItem name="password-based-auth-nextjs" />
`)

    assert.match(
      output,
      /```bash\nnpx shadcn@latest add @supabase\/password-based-auth-nextjs\n```/
    )
  })

  it('uses an explicit Vue CLI family and a production URL without a configured namespace', () => {
    const output = transformLibraryMdx(`---
title: Dropzone
description: Vue dropzone
---

<BlockItem name="dropzone-vue" framework="vue" />
`)

    assert.match(
      output,
      /npx shadcn-vue@latest add https:\/\/supabase\.com\/library\/r\/dropzone-vue.json/
    )
  })

  it('preserves the Vue composable client prerequisite before its install command', () => {
    const source = readFileSync(
      new URL('../content/docs/vue/infinite-query.mdx', import.meta.url),
      'utf8'
    )
    const output = transformLibraryMdx(source)
    assert.match(output, /already has one, reuse it/)
    assert.match(
      output,
      /npx shadcn-vue@latest add https:\/\/supabase.com\/library\/r\/infinite-query-composable.json/
    )
    assert.ok(
      output.indexOf('supabase-client-vue.json') <
        output.indexOf(
          'npx shadcn-vue@latest add https://supabase.com/library/r/infinite-query-composable.json'
        )
    )
  })

  it('preserves illustrative starter resources, relationships, and compatibility instructions', () => {
    const source = readFileSync(
      new URL('../content/docs/starters/ai-chat-app.mdx', import.meta.url),
      'utf8'
    )
    const output = transformLibraryMdx(source)
    assert.match(output, /overview illustrates key resources/)
    assert.match(output, /### Added resources/)
    assert.match(output, /public.chats/)
    assert.match(output, /### Existing resources/)
    assert.match(output, /Supabase Auth/)
    assert.match(output, /### Relationships/)
    assert.match(output, /Chat API → public.chats: Saves completed replies/)
    assert.match(output, /Next.js 13, AI SDK 2, and Supabase Auth/)
    assert.ok(output.indexOf('npx create-next-app') < output.indexOf('## Start Supabase'))
    assert.doesNotMatch(output, /CatalogPreview|BlockOverview/)
  })

  it('exports existing MCP authentication and its connection to the installed function', () => {
    const source = readFileSync(
      new URL('../content/docs/headless/mcp-server.mdx', import.meta.url),
      'utf8'
    )
    const output = transformLibraryMdx(source, { documentSlug: 'headless/mcp-server' })
    assert.match(output, /### Added resources/)
    assert.match(output, /edge-function/)
    assert.match(output, /### Existing resources/)
    assert.match(output, /Supabase Auth/)
    assert.match(output, /### Relationships/)
    assert.match(output, /https:\/\/supabase.com\/library\/docs\/nextjs\/oauth-consent.md/)
    assert.match(output, /No\n?\s*`components.json` is required/)
  })

  it('keeps dynamic TanStack DB setup with a noninteractive fallback', () => {
    const source = readFileSync(
      new URL('../content/docs/nextjs/tanstack-db.mdx', import.meta.url),
      'utf8'
    )
    const output = transformLibraryMdx(source)
    assert.match(output, /This block is generated from your project schema/)
    assert.match(output, /https:\/\/supabase.com\/library\/docs\/nextjs\/tanstack-db/)
    assert.match(output, /Your credentials are only used to fetch your database schema/)
    assert.match(output, /NEXT_PUBLIC_SUPABASE_URL/)
    assert.doesNotMatch(output, /TanstackDBGenerator/)
  })

  it('exports every published page and requested file tree without retaining installation frontmatter', () => {
    const directory = fileURLToPath(new URL('../content/docs/', import.meta.url))
    const sources = collectMdxFiles(directory)
    const documentSlugs = new Set(
      sources.map((source) => getDocSlug(path.relative(directory, source)))
    )
    let fileTrees = 0
    for (const source of sources) {
      const raw = readFileSync(source, 'utf8')
      assert.doesNotMatch(raw, /^installation(?:Content)?:/m, source)
      const output = transformLibraryMdx(raw, {
        documentSlugs,
        documentSlug: getDocSlug(path.relative(directory, source)),
      })
      for (const [, name] of raw.matchAll(/<BlockOverview\s+name="([^"]+)"\s+showFiles\b/g)) {
        fileTrees++
        assert.match(output, /## Files/, source)
        assert.match(output, /^- `[^`]+\/`$/m, `${source} has no file tree`)
        assert.ok(
          output.includes(`Full source: https://supabase.com/library/r/${name}.json`),
          source
        )
      }
    }
    assert.equal(fileTrees, 65)
  })

  it('includes first-party dependency source files in the authentication file inventory', () => {
    const output = transformLibraryMdx(
      '<BlockOverview name="password-based-auth-nextjs" showFiles />'
    )
    assert.match(output, /`safe-next-path.ts`/)
    assert.match(output, /Full source: https:\/\/supabase.com\/library\/r\/safe-next-path.json/)
    assert.match(output, /External registry dependencies:/)
  })

  it('rejects unknown registry IDs and unsupported semantic components', () => {
    assert.throws(
      () => transformLibraryMdx('<BlockItem name="missing-block" />'),
      /Missing registry item.*missing-block/
    )
    assert.throws(
      () => transformLibraryMdx('<BlockOverview name="missing-block" />'),
      /Missing registry item.*missing-block/
    )
    assert.throws(() => transformLibraryMdx('<BlockItem />'), /requires a name/)
    assert.throws(
      () => transformLibraryMdx('<FutureInstallation />'),
      /No Markdown handler.*FutureInstallation/
    )
    assert.throws(
      () => transformLibraryMdx('<BlockItem name="mcp-server" framework="unknown" />'),
      /Unsupported install framework/
    )
  })

  it('fails on missing or malformed registry artifacts instead of dropping their file trees', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'library-markdown-registry-'))
    const source = '<BlockOverview name="mcp-server" showFiles />'
    try {
      assert.throws(
        () => transformLibraryMdx(source, { registryDirectory: directory }),
        /Cannot export registry files for mcp-server/
      )
      writeFileSync(path.join(directory, 'mcp-server.json'), '{')
      assert.throws(
        () => transformLibraryMdx(source, { registryDirectory: directory }),
        /Cannot export registry files for mcp-server/
      )
      writeFileSync(
        path.join(directory, 'mcp-server.json'),
        JSON.stringify({ name: 'mcp-server', files: [{ path: 'missing-content.ts' }] })
      )
      assert.throws(
        () => transformLibraryMdx(source, { registryDirectory: directory }),
        /Cannot export registry files for mcp-server/
      )
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('keeps usage copy and omits interactive previews', () => {
    const output = transformLibraryMdx(`---
title: Auth
description: Auth block
---

<BlockPreview name="password-based-auth/auth/sign-up" />

## Usage

Set \`NEXT_PUBLIC_SUPABASE_URL\` in \`.env.local\`.

<Callout type="warning">This client is built for SSR.</Callout>
`)

    assert.doesNotMatch(output, /BlockPreview/)
    assert.match(output, /## Usage/)
    assert.match(output, /NEXT_PUBLIC_SUPABASE_URL/)
    assert.match(output, /Warning: This client is built for SSR\./)
  })

  it('rewrites library docs links to absolute markdown URLs', () => {
    const output = transformLibraryMdx(`---
title: Client
description: Client
---

See the [React client](/library/docs/react/client).
`)

    assert.match(output, /https:\/\/supabase\.com\/library\/docs\/react\/client\.md/)
  })

  it('rewrites documentation links nested inside components', () => {
    const output = transformLibraryMdx(`---
title: Auth
description: Auth block
---

<Callout type="note">
See the [React client](/library/docs/react/client) before installing.
</Callout>
`)

    assert.match(
      output,
      /Note: See the \[React client\]\(https:\/\/supabase\.com\/library\/docs\/react\/client\.md\) before installing\./
    )
  })

  it('preserves URL queries and anchors while validating relative, JSX, and Markdown links', () => {
    const options = {
      documentSlug: 'headless/mcp-server',
      documentSlugs: new Set(['nextjs/oauth-consent']),
    }
    const output = transformLibraryMdx(
      '[Consent](../nextjs/oauth-consent?source=guide#usage)\n\n<a href="/library/docs/nextjs/oauth-consent#usage">Consent</a>',
      options
    )
    assert.match(output, /oauth-consent.md\?source=guide#usage/)
    assert.match(output, /oauth-consent.md#usage/)
    assert.throws(
      () => transformLibraryMdx('[Missing](/library/docs/missing)', options),
      /Missing library document: missing/
    )
    assert.throws(
      () => transformLibraryMdx('<a href="/library/docs/missing">Missing</a>', options),
      /Missing library document: missing/
    )
  })
})
