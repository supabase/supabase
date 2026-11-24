import { parseChangedFilesList } from './paths.ts'
import type { ScopeResult } from './run-suite.ts'
import { formatAnnotation, formatJobSummary, formatLog } from './truncation.ts'

export type ResolveScopeCliConfig = {
  label: string
  repoRoot: string
  resolveScope: (options: { changedFiles: string[]; repoRoot: string }) => Promise<ScopeResult>
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export async function runResolveScopeCli(config: ResolveScopeCliConfig): Promise<void> {
  const argv = process.argv.slice(2)
  const filesIdx = argv.indexOf('--files')

  let changedFiles: string[]
  if (filesIdx !== -1 && argv[filesIdx + 1]) {
    changedFiles = parseChangedFilesList(argv[filesIdx + 1])
  } else if (process.stdin.isTTY) {
    console.error('Pass changed files via stdin or --files path1,path2')
    process.exit(2)
  } else {
    changedFiles = parseChangedFilesList(await readStdin())
  }

  const result = await config.resolveScope({ changedFiles, repoRoot: config.repoRoot })
  const a11yLine = result.a11yPages ? `a11y_paths=${result.a11yPages.join(',')}\n` : ''
  const output = `skip=${result.skip}\npaths=${result.pages.join(',')}\n${a11yLine}`

  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs')
    appendFileSync(process.env.GITHUB_OUTPUT, output)
  } else {
    process.stdout.write(output)
  }

  if (result.pages.length > 0) {
    console.error(`Resolved ${result.pages.length} ${config.label} page(s):`)
    for (const page of result.pages) {
      console.error(`  ${page}`)
    }
  } else {
    console.error(`No in-scope ${config.label} pages — skipping Playwright suite.`)
  }

  if (result.truncated?.length) {
    const truncation = {
      label: config.label,
      check: 'accessibility scan',
      limit: result.limit ?? result.pages.length,
      truncated: result.truncated,
    }
    console.error(formatLog(truncation))
    console.error(
      `::warning title=Pages without accessibility scan::${formatAnnotation(truncation)}`
    )
    if (process.env.GITHUB_STEP_SUMMARY) {
      const { appendFileSync } = await import('node:fs')
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, formatJobSummary(truncation))
    }
  }
}
