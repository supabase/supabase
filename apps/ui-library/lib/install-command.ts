export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
export type ShadcnFramework = 'react' | 'vue'

function getRegistrySpecifier(name: string, framework: ShadcnFramework, env?: string): string {
  if (env === 'production') {
    // The Supabase namespace is registered with shadcn, but not shadcn-vue.
    return framework === 'vue' ? `https://supabase.com/library/r/${name}.json` : `@supabase/${name}`
  }
  const origin =
    env === 'preview'
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
      : 'http://localhost:3004'
  return `${origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/r/${name}.json`
}

export function getInstallCommands(
  name: string,
  options?: { framework?: ShadcnFramework; production?: boolean }
): Record<PackageManager, string> {
  const framework = options?.framework ?? 'react'
  const env = options?.production ? 'production' : process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV
  const specifier = getRegistrySpecifier(name, framework, env)
  const cli = framework === 'vue' ? 'shadcn-vue@latest' : 'shadcn@latest'

  return {
    npm: `npx ${cli} add ${specifier}`,
    pnpm: `pnpm dlx ${cli} add ${specifier}`,
    yarn: `yarn dlx ${cli} add ${specifier}`,
    bun: `bunx --bun ${cli} add ${specifier}`,
  }
}
