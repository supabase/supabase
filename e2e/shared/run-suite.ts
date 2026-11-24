import { spawn } from 'node:child_process'

import { collectChangedFiles, repoRootFrom } from './git.ts'
import { formatLocalWarning } from './truncation.ts'

export type ScopeResult = {
  pages: string[]
  // Pages that also get the accessibility scan. Defaults to `pages` when unset.
  a11yPages?: string[]
  skip: boolean
  // In scope but over the accessibility scan limit, so they get no scan.
  truncated?: string[]
  limit?: number
}

export type SuiteConfig = {
  root: string
  label: string
  devCommand: string
  pagePathsEnv: string
  a11yPagePathsEnv?: string
  baseRefEnv: string
  defaultBaseUrl: string
  resolveScope: (options: { changedFiles: string[]; repoRoot: string }) => Promise<ScopeResult>
  resolveAllPages?: (repoRoot: string) => Promise<string[]>
}

const PREFLIGHT_TIMEOUT_MS = 3_000

async function isBaseUrlReachable(baseUrl: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PREFLIGHT_TIMEOUT_MS)
  try {
    await fetch(baseUrl, { signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

type ResolvedPages = { pages: string[]; a11yPages?: string[] }

async function resolvePagePaths(config: SuiteConfig): Promise<ResolvedPages | null> {
  const explicit = process.env[config.pagePathsEnv]?.trim()
  if (explicit) {
    return {
      pages: explicit
        .split(/[\n,]/)
        .map((path) => path.trim())
        .filter(Boolean),
    }
  }

  const baseRef = process.env[config.baseRefEnv]?.trim() || 'origin/master'
  const repoRoot = repoRootFrom(config.root)
  const changedFiles = collectChangedFiles(repoRoot, baseRef)
  const result = await config.resolveScope({ changedFiles, repoRoot })

  if (result.skip) {
    console.error(
      `No in-scope ${config.label} pages changed vs ${baseRef} (including working tree). Skipping Playwright.`
    )
    return null
  }

  console.error(
    `Resolved ${result.pages.length} ${config.label} page(s) from changes vs ${baseRef}:`
  )
  for (const page of result.pages) {
    console.error(`  ${page}`)
  }
  if (result.truncated?.length) {
    console.error(
      formatLocalWarning({
        label: config.label,
        check: 'accessibility scan',
        limit: result.limit ?? result.pages.length,
        truncated: result.truncated,
      })
    )
  }
  return { pages: result.pages, a11yPages: result.a11yPages }
}

export async function runSuite(config: SuiteConfig): Promise<void> {
  const rawArgs = process.argv.slice(2)
  const runAll = rawArgs.includes('--all')
  const playwrightArgs = rawArgs.filter((arg) => arg !== '--all' && arg !== '--')

  let resolved: ResolvedPages | null
  if (runAll && config.resolveAllPages) {
    const pages = await config.resolveAllPages(repoRootFrom(config.root))
    console.error(`Resolved all ${pages.length} in-scope ${config.label} page(s).`)
    resolved = { pages }
  } else {
    resolved = await resolvePagePaths(config)
  }
  if (resolved === null) process.exit(0)

  const hasMaxFailuresArg = playwrightArgs.some(
    (arg) => arg === '-x' || arg.startsWith('--max-failures')
  )
  const finalArgs =
    runAll && !hasMaxFailuresArg ? [...playwrightArgs, '--max-failures=0'] : playwrightArgs

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || config.defaultBaseUrl
  if (!(await isBaseUrlReachable(baseUrl))) {
    console.error(`No ${config.label} server responding at ${baseUrl}.`)
    if (!process.env.PLAYWRIGHT_BASE_URL) {
      console.error(`Start it with \`${config.devCommand}\`, or point at a deployed site.`)
    } else {
      console.error('Check that the URL is correct and reachable.')
    }
    process.exit(1)
  }

  // Clear a stale scan list from the shell so runs without one scan every page.
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    [config.pagePathsEnv]: resolved.pages.join(','),
  }
  if (config.a11yPagePathsEnv) {
    if (resolved.a11yPages) childEnv[config.a11yPagePathsEnv] = resolved.a11yPages.join(',')
    else delete childEnv[config.a11yPagePathsEnv]
  }

  const child = spawn('pnpm', ['exec', 'playwright', 'test', ...finalArgs], {
    cwd: config.root,
    env: childEnv,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 1)
  })
}
