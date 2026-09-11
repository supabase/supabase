import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { transformLibraryMdx } from './library-mdx-to-markdown'

describe('transformLibraryMdx', () => {
  it('exports ordered install steps and their setup notes from page metadata', () => {
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

  it('uses shadcn-vue for Vue and Nuxt blocks', () => {
    const output = transformLibraryMdx(`---
title: Dropzone
description: Vue dropzone
---

<BlockItem name="dropzone-vue" />
`)

    assert.match(output, /npx shadcn-vue@latest add @supabase\/dropzone-vue/)
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
})
