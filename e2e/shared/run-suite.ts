import { spawn } from 'node:child_process'

import { collectChangedFiles, repoRootFrom } from './git.ts'

export type ScopeResult = { pages: string[]; skip: boolean }

type SuiteBase = {
  root: string
  label: string
  devCommand: string
  defaultBaseUrl: string
  project?: string
  // Projects an `--all` run selects instead of `project`, for a whole-suite report.
  allProjects?: string[]
}

type ScopedSuite = {
  pagePathsEnv: string
  baseRefEnv: string
  resolveScope: (options: { changedFiles: string[]; repoRoot: string }) => Promise<ScopeResult>
  resolveAllPages?: (repoRoot: string) => Promise<string[]>
}

// A fixed page list resolves nothing from git, so none of the scope plumbing applies.
type FixedScopeSuite = {
  pagePathsEnv?: undefined
  baseRefEnv?: undefined
  resolveScope?: undefined
  resolveAllPages?: undefined
}

export type SuiteConfig = SuiteBase & (ScopedSuite | FixedScopeSuite)

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

async function resolvePagePaths(config: SuiteBase & ScopedSuite): Promise<string[] | null> {
  const explicit = process.env[config.pagePathsEnv]?.trim()
  if (explicit) {
    return explicit
      .split(/[\n,]/)
      .map((path) => path.trim())
      .filter(Boolean)
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
  return result.pages
}

export async function runSuite(config: SuiteConfig): Promise<void> {
  const rawArgs = process.argv.slice(2)
  const runAll = rawArgs.includes('--all')
  const playwrightArgs = rawArgs.filter((arg) => arg !== '--all' && arg !== '--')

  let pages: string[] | null = null
  if (config.resolveScope) {
    if (runAll && config.resolveAllPages) {
      pages = await config.resolveAllPages(repoRootFrom(config.root))
      console.error(`Resolved all ${pages.length} in-scope ${config.label} page(s).`)
    } else {
      pages = await resolvePagePaths(config)
    }
    if (pages === null) process.exit(0)
  }

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

  // First, so an explicit --project on the command line overrides it.
  const selected = (runAll && config.allProjects) || (config.project ? [config.project] : [])
  const projectArgs = selected.map((project) => `--project=${project}`)
  const env = { ...process.env }
  if (config.pagePathsEnv && pages) env[config.pagePathsEnv] = pages.join(',')

  const child = spawn('pnpm', ['exec', 'playwright', 'test', ...projectArgs, ...finalArgs], {
    cwd: config.root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('error', (error) => {
    console.error(`Failed to start Playwright: ${error.message}`)
    process.exit(1)
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 1)
  })
}
