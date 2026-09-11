import assert from 'node:assert/strict'
import { describe, it, type TestContext } from 'node:test'

import { getInstallCommands } from '../lib/install-command'

function setEnvironment(t: TestContext, values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    const previous = process.env[key]
    t.after(() => {
      if (previous === undefined) delete process.env[key]
      else process.env[key] = previous
    })
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

describe('registry install commands', () => {
  it('uses the React namespace in production for each package manager', () => {
    assert.deepEqual(getInstallCommands('dropzone-react', { production: true }), {
      npm: 'npx shadcn@latest add @supabase/dropzone-react',
      pnpm: 'pnpm dlx shadcn@latest add @supabase/dropzone-react',
      yarn: 'yarn dlx shadcn@latest add @supabase/dropzone-react',
      bun: 'bunx --bun shadcn@latest add @supabase/dropzone-react',
    })
  })

  it('uses the explicit Vue CLI and absolute production URL without namespace setup', () => {
    for (const name of ['dropzone-vue', 'dropzone-nuxtjs', 'infinite-query-composable']) {
      const commands = getInstallCommands(name, { framework: 'vue', production: true })
      assert.equal(
        commands.npm,
        `npx shadcn-vue@latest add https://supabase.com/library/r/${name}.json`
      )
      assert.ok(
        Object.values(commands).every((command) =>
          command.includes('shadcn-vue@latest add https://')
        )
      )
      assert.ok(Object.values(commands).every((command) => !command.includes('@supabase/')))
    }
  })

  it('does not guess the CLI from a registry name', () => {
    assert.equal(
      getInstallCommands('vue-named-react-component', { framework: 'react', production: true }).npm,
      'npx shadcn@latest add @supabase/vue-named-react-component'
    )
  })

  it('uses the configured preview hostname and base path for either CLI', (t) => {
    setEnvironment(t, {
      NEXT_PUBLIC_VERCEL_TARGET_ENV: 'preview',
      NEXT_PUBLIC_VERCEL_BRANCH_URL: 'library-example.vercel.app',
      NEXT_PUBLIC_BASE_PATH: '/library',
    })
    assert.equal(
      getInstallCommands('infinite-query-composable', { framework: 'vue' }).pnpm,
      'pnpm dlx shadcn-vue@latest add https://library-example.vercel.app/library/r/infinite-query-composable.json'
    )
    assert.equal(
      getInstallCommands('dropzone-react').npm,
      'npx shadcn@latest add https://library-example.vercel.app/library/r/dropzone-react.json'
    )
  })

  it('uses local registry URLs with and without a base path', (t) => {
    setEnvironment(t, {
      NEXT_PUBLIC_VERCEL_TARGET_ENV: 'development',
      NEXT_PUBLIC_BASE_PATH: undefined,
    })
    assert.equal(
      getInstallCommands('dropzone-react').npm,
      'npx shadcn@latest add http://localhost:3004/r/dropzone-react.json'
    )
    process.env.NEXT_PUBLIC_BASE_PATH = '/library'
    assert.equal(
      getInstallCommands('dropzone-react').npm,
      'npx shadcn@latest add http://localhost:3004/library/r/dropzone-react.json'
    )
  })
})
