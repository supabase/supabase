import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { transformLibraryMdx } from './library-mdx-to-markdown'

describe('transformLibraryMdx', () => {
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
