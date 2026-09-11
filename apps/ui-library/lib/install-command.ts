export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
export type ShadcnFramework = 'react' | 'vue'

export function getShadcnFramework(name: string): ShadcnFramework {
  return name.includes('vue') || name.includes('nuxtjs') ? 'vue' : 'react'
}

export function getRegistryBaseUrl(env = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV): string {
  if (env === 'production') {
    // Special alias for production, added in https://github.com/shadcn-ui/ui/pull/8161
    return '@supabase'
  }
  if (env === 'preview') {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  }
  return 'http://localhost:3004'
}

export function getRegistryComponentPath(
  name: string,
  env = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV
): string {
  if (env === 'production') {
    return `/${name}`
  }
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/r/${name}.json`
}

export function getInstallCommands(
  name: string,
  options?: { framework?: ShadcnFramework; production?: boolean }
): Record<PackageManager, string> {
  const framework = options?.framework ?? getShadcnFramework(name)
  const env = options?.production ? 'production' : process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV
  const specifier = `${getRegistryBaseUrl(env)}${getRegistryComponentPath(name, env)}`
  const cli = framework === 'vue' ? 'shadcn-vue@latest' : 'shadcn@latest'

  return {
    npm: `npx ${cli} add ${specifier}`,
    pnpm: `pnpm dlx ${cli} add ${specifier}`,
    yarn: `yarn dlx ${cli} add ${specifier}`,
    bun: `bunx --bun ${cli} add ${specifier}`,
  }
}

function getCustomCommandForPackageManager(
  command: string,
  packageManager: PackageManager
): string {
  if (packageManager === 'npm') return command

  const replacements: Record<Exclude<PackageManager, 'npm'>, Array<[RegExp, string]>> = {
    pnpm: [
      [/\bnpx create-next-app@latest/g, 'pnpm create next-app@latest'],
      [/\bnpx (shadcn(?:-vue)?@latest)/g, 'pnpm dlx $1'],
      [/--use-npm/g, '--use-pnpm'],
    ],
    yarn: [
      [/\bnpx create-next-app@latest/g, 'yarn create next-app'],
      [/\bnpx (shadcn(?:-vue)?@latest)/g, 'yarn dlx $1'],
      [/--use-npm/g, '--use-yarn'],
    ],
    bun: [
      [/\bnpx create-next-app@latest/g, 'bun create next-app'],
      [/\bnpx (shadcn(?:-vue)?@latest)/g, 'bunx --bun $1'],
      [/--use-npm/g, '--use-bun'],
    ],
  }

  return replacements[packageManager].reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    command
  )
}

export function getInstallationCommands(
  steps: Array<{ registry?: string; command?: string }>
): Partial<Record<PackageManager, string>> {
  const packageManagers: PackageManager[] = steps.some((step) => step.registry)
    ? ['npm', 'pnpm', 'yarn', 'bun']
    : ['npm']

  return Object.fromEntries(
    packageManagers.map((packageManager) => [
      packageManager,
      steps
        .map((step) =>
          step.registry
            ? getInstallCommands(step.registry)[packageManager]
            : getCustomCommandForPackageManager(step.command ?? '', packageManager)
        )
        .filter(Boolean)
        .join('\n\n'),
    ])
  ) as Partial<Record<PackageManager, string>>
}
