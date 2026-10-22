import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// The kb app root, where `astro build` runs. `import.meta.url` can't be used
// here: Astro bundles this module into dist/, so its location isn't the source
// location. `--relative` makes git print paths from this directory, matching
// the `filePath` on content entries (e.g. "src/content/guides/foo.mdx").
const APP_ROOT = process.cwd()

// A full `git log` over a folder with long history can run to tens of MB.
const MAX_BUFFER = 64 * 1024 * 1024

/**
 * Parses `git log --format=@@%cI --name-status` output into a map of path ->
 * ISO committer date. `git log` lists newest commits first, so the first date
 * seen for a path is its latest edit. Renames print `R<score>\told\tnew`, so
 * the last tab-separated field is the path that exists after the commit.
 */
export function parseLastEditedLog(stdout: string): Map<string, string> {
  const dates = new Map<string, string>()
  let currentDate: string | undefined

  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trimEnd()
    if (line.startsWith('@@')) {
      currentDate = line.slice(2)
      continue
    }
    if (!line || currentDate === undefined) continue

    const fields = line.split('\t')
    const path = fields[fields.length - 1]
    if (!dates.has(path)) dates.set(path, currentDate)
  }

  return dates
}

async function git(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: APP_ROOT, maxBuffer: MAX_BUFFER })
  return stdout
}

/**
 * False for a shallow clone, or when HEAD has no parent (a truncated history
 * can report as not shallow when it has grafts).
 */
async function isHistoryComplete(): Promise<boolean> {
  if ((await git(['rev-parse', '--is-shallow-repository'])).trim() === 'true') return false
  try {
    await git(['rev-parse', '--verify', '--quiet', 'HEAD^'])
    return true
  } catch {
    return false
  }
}

async function loadLastEdited(paths: string[]): Promise<Map<string, string>> {
  // TEMPORARY: production gate removed so previews show dates. Restore
  // `if (process.env.VERCEL_ENV !== 'production') return new Map()` before
  // merging. Preview dates can drift because preview clones are often shallow.
  // if (process.env.VERCEL_ENV !== 'production') return new Map()

  try {
    // Vercel clones shallowly. `git log` on a truncated history reports the
    // tip commit's date for every file, so fetch the full history first.
    if (!(await isHistoryComplete())) {
      await git(['fetch', '--unshallow'])
    }
    if (!(await isHistoryComplete())) {
      console.warn('[git-last-edited] git history is still truncated, skipping last edited dates.')
      return new Map()
    }

    const { stdout } = await execFileAsync(
      'git',
      [
        '-c',
        'core.quotePath=false',
        'log',
        '--relative',
        '--format=@@%cI',
        '--name-status',
        '--',
        ...paths,
      ],
      { cwd: APP_ROOT, maxBuffer: MAX_BUFFER }
    )
    return parseLastEditedLog(stdout)
  } catch (error) {
    console.warn('[git-last-edited] could not read git history, skipping last edited dates:', error)
    return new Map()
  }
}

const cache = new Map<string, Promise<Map<string, string>>>()

/**
 * Last-edited dates for every file under `paths` (relative to the kb app
 * root), keyed by `filePath`. One `git log` per distinct set of paths per
 * build.
 */
export function getLastEdited(paths: string[]): Promise<Map<string, string>> {
  const key = [...paths].sort().join('\n')
  let result = cache.get(key)
  if (!result) {
    result = loadLastEdited(paths)
    cache.set(key, result)
  }
  return result
}
