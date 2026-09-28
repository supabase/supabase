import { describe, expect, it } from 'vitest'

import { transformLibraryMdx } from './library-mdx-to-markdown'

describe('transformLibraryMdx', () => {
  it('lifts title and description into a markdown header', () => {
    const output = transformLibraryMdx(`---
title: Password-based Authentication
description: Password-based authentication block for Next.js
---

Hello world.
`)

    expect(output).toMatch(
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

    expect(output).toMatch(
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

    expect(output).toMatch(
      /npx shadcn-vue@latest add https:\/\/supabase\.com\/library\/r\/dropzone-vue.json/
    )
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

    expect(output).not.toMatch(/BlockPreview/)
    expect(output).toMatch(/## Usage/)
    expect(output).toMatch(/NEXT_PUBLIC_SUPABASE_URL/)
    expect(output).toMatch(/Warning: This client is built for SSR\./)
  })

  it('rewrites library docs links to absolute markdown URLs', () => {
    const output = transformLibraryMdx(`---
title: Client
description: Client
---

See the [React client](/library/docs/react/client).
`)

    expect(output).toMatch(/https:\/\/supabase\.com\/library\/docs\/react\/client\.md/)
  })

  it('resolves a relative link from an index document within its own directory', () => {
    const output = transformLibraryMdx(
      `---
title: Foo
description: Foo
---

See the [child page](./child).
`,
      { documentSlugs: new Set(['foo', 'foo/child']), documentBasePath: 'foo/index' }
    )

    expect(output).toMatch(/https:\/\/supabase\.com\/library\/docs\/foo\/child\.md/)
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

    expect(output).toMatch(
      /Note: See the \[React client\]\(https:\/\/supabase\.com\/library\/docs\/react\/client\.md\) before installing\./
    )
  })
})
