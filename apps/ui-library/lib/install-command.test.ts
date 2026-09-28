import { afterEach, describe, expect, it, vi } from 'vitest'

import { getInstallCommands } from '../lib/install-command'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('registry install commands', () => {
  it('uses the React namespace in production for each package manager', () => {
    expect(getInstallCommands('dropzone-react', { production: true })).toEqual({
      npm: 'npx shadcn@latest add @supabase/dropzone-react',
      pnpm: 'pnpm dlx shadcn@latest add @supabase/dropzone-react',
      yarn: 'yarn dlx shadcn@latest add @supabase/dropzone-react',
      bun: 'bunx --bun shadcn@latest add @supabase/dropzone-react',
    })
  })

  it('uses the explicit Vue CLI and absolute production URL without namespace setup', () => {
    for (const name of ['dropzone-vue', 'dropzone-nuxtjs', 'infinite-query-composable']) {
      const commands = getInstallCommands(name, { framework: 'vue', production: true })
      expect(commands.npm).toBe(
        `npx shadcn-vue@latest add https://supabase.com/library/r/${name}.json`
      )
      expect(
        Object.values(commands).every((command) =>
          command.includes('shadcn-vue@latest add https://')
        )
      ).toBe(true)
      expect(Object.values(commands).every((command) => !command.includes('@supabase/'))).toBe(true)
    }
  })

  it('does not guess the CLI from a registry name', () => {
    expect(
      getInstallCommands('vue-named-react-component', { framework: 'react', production: true }).npm
    ).toBe('npx shadcn@latest add @supabase/vue-named-react-component')
  })

  it('uses the configured preview hostname and base path for either CLI', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_TARGET_ENV', 'preview')
    vi.stubEnv('NEXT_PUBLIC_VERCEL_BRANCH_URL', 'library-example.vercel.app')
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/library')

    expect(getInstallCommands('infinite-query-composable', { framework: 'vue' }).pnpm).toBe(
      'pnpm dlx shadcn-vue@latest add https://library-example.vercel.app/library/r/infinite-query-composable.json'
    )
    expect(getInstallCommands('dropzone-react').npm).toBe(
      'npx shadcn@latest add https://library-example.vercel.app/library/r/dropzone-react.json'
    )
  })

  it('uses local registry URLs with and without a base path', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_TARGET_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', undefined)

    expect(getInstallCommands('dropzone-react').npm).toBe(
      'npx shadcn@latest add http://localhost:3004/r/dropzone-react.json'
    )

    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/library')
    expect(getInstallCommands('dropzone-react').npm).toBe(
      'npx shadcn@latest add http://localhost:3004/library/r/dropzone-react.json'
    )
  })
})
