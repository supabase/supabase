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

export function getPageBaseUrl(env = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV): string {
  if (env === 'production') {
    return 'https://supabase.com'
  }
  return getRegistryBaseUrl(env)
}

export function getPageUrl(pathname: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const currentPath = pathname.startsWith(basePath) ? pathname : `${basePath}${pathname}`
  return `${getPageBaseUrl()}${currentPath}`
}

export function getMarkdownPageUrl(pathname: string): string {
  const url = getPageUrl(pathname)
  return url.endsWith('.md') ? url : `${url}.md`
}

export function buildBlockInstallPrompt({
  pageUrl,
  name,
  installCommand,
}: {
  pageUrl: string
  name: string
  installCommand: string
}): string {
  return `Help me install the ${name} block. Do the following: 1. Read ${pageUrl}. 2. Install the block with \`${installCommand}\`. 3. Follow the remaining setup and configuration steps on that page.`
}
