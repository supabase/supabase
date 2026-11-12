#!/usr/bin/env node
/**
 * Tags supabase.com links in this repo's GitHub-facing markdown (see INCLUDE_PATTERNS: the root
 * README, CONTRIBUTING and DEVELOPERS files, example READMEs, the self-hosting guides, each app and
 * package README, and the translated READMEs) with:
 *
 *   utm_source=<repo>            which repository the link lives in
 *   utm_content=<file path>      which file in that repository the link lives in
 *
 * so sign-ups that start from a README can be attributed to it.
 *
 * Re-run it whenever files move. It is idempotent, and it refreshes `utm_content` on links that
 * already carry our `utm_source` so the path always matches the file the link currently sits in.
 *
 * What it does and does not touch:
 *   - Only `supabase.com` and `www.supabase.com`. Other subdomains and look-alike hosts are left alone.
 *   - Links that already have a `utm_*` param with a different `utm_source` are left alone.
 *   - Fenced code blocks, inline code, images, `src` attributes and non-page assets are skipped.
 *   - A bare URL is wrapped as `[url](url?utm_...)` so the visible text stays clean. When a link's text
 *     is the URL itself, only the href is tagged.
 *   - URLs with placeholders (`<ref>`, `[ref]`, `{ref}`, `$VAR`) are skipped.
 *   - A URL ends at the first non-ASCII character, so it stops at full-width punctuation (`。`, `）`) in
 *     translated text. One that runs straight into letters, like `https://supabase.com/docs查看`, is skipped.
 *
 * Usage:
 *   node scripts/tag-readme-links.mjs                 # rewrite files in place
 *   node scripts/tag-readme-links.mjs --check         # exit 1 if any file would change (writes nothing)
 *   node scripts/tag-readme-links.mjs --repo <name>   # override utm_source (default: supabase)
 *   node scripts/tag-readme-links.mjs <file>...       # limit to specific files
 *
 * To cover more files, add a pattern to INCLUDE_PATTERNS.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const DEFAULT_REPO = 'supabase'

/** Tracked files (repo-relative, forward slashes) that are rendered on GitHub and link out to supabase.com. */
export const INCLUDE_PATTERNS = [
  /^(?:README|CONTRIBUTING|DEVELOPERS)\.md$/i,
  // Self-hosting guides.
  /^docker\/(?:README|CONFIG)\.md$/i,
  // The README at the top of each app and package. Nested READMEs are developer notes, not entry points.
  /^(?:apps|packages)\/[^/]+\/README\.md$/i,
  // Translations of the root README.
  /^i18n\/[^/]+\.md$/i,
  // `examples/prompts` holds prompt files that people copy into AI tools, not pages people click through.
  /^examples\/(?!prompts\/)(?:.+\/)?README\.md$/i,
]

export function isInScope(filePath) {
  return INCLUDE_PATTERNS.some((pattern) => pattern.test(filePath))
}

// `supabase.com` / `www.supabase.com` only. The lookbehind avoids matching inside a longer URL
// (`web.archive.org/web/https://supabase.com`); the lookahead rejects `supabase.com.evil` but allows a
// sentence-ending period.
const URL_PATTERN =
  /(?<![\w./@-])https?:\/\/(?:www\.)?supabase\.com(?![\w-]|\.\w)(?:[/?#][^\s<>"'`)\]\u0080-\uFFFF]*)?/g

const TRAILING_PUNCTUATION = /[.,;:!?*]+$/

// Assets and downloads rather than pages people land on.
const NON_PAGE_PATH =
  /\.(?:png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|pdf|json|xml|txt|zip|sh)$|\/images\//i

const FENCE = /^ {0,3}(`{3,}|~{3,})/

/** Percent-encodes a repo path for use as a query value, keeping `/` readable. */
function encodeUtmValue(value) {
  return encodeURIComponent(value)
    .replace(/%2F/gi, '/')
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

/**
 * Adds or refreshes our UTM params on a single URL. String surgery rather than `new URL()` so everything
 * else about the link (casing, encoding, param order, fragment) is preserved byte-for-byte.
 *
 * @returns {{ url: string, status: 'added' | 'refreshed' | 'unchanged' | 'foreign' | 'skipped' }}
 */
export function tagUrl(url, { repo = DEFAULT_REPO, filePath }) {
  const hashIndex = url.indexOf('#')
  const fragment = hashIndex === -1 ? '' : url.slice(hashIndex)
  const withoutFragment = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const queryIndex = withoutFragment.indexOf('?')
  let base = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex)
  const params =
    queryIndex === -1
      ? []
      : withoutFragment
          .slice(queryIndex + 1)
          .split('&')
          .filter(Boolean)

  const pathname = base.replace(/^https?:\/\/[^/]+/, '')
  if (NON_PAGE_PATH.test(pathname)) return { url, status: 'skipped' }

  const ourSource = `utm_source=${repo}`
  const source = params.find((param) => param.startsWith('utm_source='))
  const hasUtm = params.some((param) => /^utm_/i.test(param))
  // Someone else's tagging (including a lone utm_content): leave it alone.
  if (hasUtm && source !== ourSource) return { url, status: 'foreign' }

  const content = `utm_content=${encodeUtmValue(filePath)}`
  let nextParams
  if (source === ourSource) {
    nextParams = params.some((param) => param.startsWith('utm_content='))
      ? params.map((param) => (param.startsWith('utm_content=') ? content : param))
      : [...params, content]
  } else {
    nextParams = [...params, ourSource, content]
  }

  if (pathname === '') base += '/'
  const tagged = `${base}?${nextParams.join('&')}${fragment}`
  if (tagged === url) return { url, status: 'unchanged' }
  return { url: tagged, status: source === ourSource ? 'refreshed' : 'added' }
}

/**
 * Where a URL sits on its line decides how it can be rewritten.
 *  - 'href': the destination of a link, safe to tag in place
 *  - 'bare': visible text, wrapped so the text stays the same
 *  - 'skip': image, attribute or link text that must not change
 */
function classify(before, after) {
  if (/\bsrc(?:set)?\s*=\s*["']?$/i.test(before)) return 'skip'
  if (/!\[[^\]]*\]\(\s*<?$/.test(before)) return 'skip'
  if (
    /\]\(\s*<?$/.test(before) ||
    /\bhref\s*=\s*["']?$/i.test(before) ||
    /^\s*\[[^\]]+\]:\s*<?$/.test(before)
  ) {
    return 'href'
  }
  if (/=\s*["']$/.test(before)) return 'skip'
  // Inside the text of a `[text](url)` or `[text][ref]` link.
  if (/^[^[\]]*\]\s*[([]/.test(after)) return 'skip'
  // Text node inside an HTML element, e.g. `<a href="…">https://supabase.com</a>`.
  if (/^<\/\w/.test(after)) return 'skip'
  return 'bare'
}

function tagSegment(segment, context, stats) {
  let output = ''
  let cursor = 0

  for (const match of segment.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, '')
    const start = match.index
    const end = start + url.length
    const nextChar = segment[start + match[0].length]
    if (start < cursor) continue

    const runsIntoText = nextChar !== undefined && /[\p{L}\p{N}]/u.test(nextChar)
    if (/[[{}$]/.test(url) || nextChar === '<' || nextChar === '{' || runsIntoText) {
      stats.skipped++
      continue
    }

    const before = segment.slice(0, start)
    const after = segment.slice(end)
    const kind = classify(before, after)
    if (kind === 'skip') {
      stats.skipped++
      continue
    }

    const result = tagUrl(url, context)
    stats[result.status]++
    if (result.status !== 'added' && result.status !== 'refreshed') continue

    if (kind === 'href') {
      output += segment.slice(cursor, start) + result.url
      cursor = end
    } else if (before.endsWith('<') && after.startsWith('>')) {
      // `<https://…>` autolink: swap the angle brackets for a link with the same visible text.
      output += `${segment.slice(cursor, start - 1)}[${url}](${result.url})`
      cursor = end + 1
    } else {
      output += `${segment.slice(cursor, start)}[${url}](${result.url})`
      cursor = end
    }
  }

  return output + segment.slice(cursor)
}

/**
 * Tags every eligible supabase.com link in a markdown document.
 *
 * @returns {{ text: string, added: number, refreshed: number, unchanged: number, foreign: number, skipped: number }}
 */
export function tagMarkdown(text, { repo = DEFAULT_REPO, filePath }) {
  const stats = { added: 0, refreshed: 0, unchanged: 0, foreign: 0, skipped: 0 }
  const context = { repo, filePath }
  let fence = null

  const lines = text.split('\n').map((line) => {
    const fenceMatch = FENCE.exec(line)
    if (fence) {
      const isClosing =
        fenceMatch && fenceMatch[1][0] === fence.char && fenceMatch[1].length >= fence.length
      if (isClosing && line.trim() === fenceMatch[1]) fence = null
      return line
    }
    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], length: fenceMatch[1].length }
      return line
    }

    // Odd indexes are inline code spans.
    return line
      .split(/(``.+?``|`[^`]*`)/)
      .map((segment, index) => (index % 2 === 1 ? segment : tagSegment(segment, context, stats)))
      .join('')
  })

  return { text: lines.join('\n'), ...stats }
}

function repoRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
}

/**
 * Files git knows about (tracked, or untracked but not ignored) that exist on disk. Including untracked
 * files and skipping missing ones means the script behaves the same whether a file was moved with
 * `git mv`, or just renamed and not staged yet.
 */
export function listCandidateFiles(root) {
  const listed = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }
  )
    .split('\0')
    .filter(Boolean)
  return [...new Set(listed)].filter((file) => fs.existsSync(path.join(root, file)))
}

function parseArgs(argv) {
  const options = { check: false, repo: DEFAULT_REPO, files: [], help: false }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--check') options.check = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--repo') options.repo = argv[++index]
    else if (arg.startsWith('--repo=')) options.repo = arg.slice('--repo='.length)
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
    else options.files.push(arg)
  }
  if (!options.repo) throw new Error('--repo needs a value')
  return options
}

function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exit(2)
  }
  if (options.help) {
    console.log(
      'Usage: node scripts/tag-readme-links.mjs [--check] [--repo <name>] [<file>...]\n' +
        'See the header of scripts/tag-readme-links.mjs for details.'
    )
    return
  }

  const root = repoRoot()
  const candidates = new Set(listCandidateFiles(root))
  const requested = options.files.map((file) =>
    path.relative(root, path.resolve(file)).split(path.sep).join('/')
  )
  const files = (options.files.length > 0 ? requested : [...candidates]).filter(
    (file) => candidates.has(file) && isInScope(file)
  )

  const totals = { added: 0, refreshed: 0 }
  const changedFiles = []

  for (const file of files) {
    const absolutePath = path.join(root, file)
    const original = fs.readFileSync(absolutePath, 'utf8')
    const result = tagMarkdown(original, { repo: options.repo, filePath: file })
    if (result.text === original) continue

    changedFiles.push(file)
    totals.added += result.added
    totals.refreshed += result.refreshed
    if (!options.check) fs.writeFileSync(absolutePath, result.text)
  }

  const verb = options.check ? 'would change' : 'changed'
  console.log(
    `Scanned ${files.length} files; ${verb} ${changedFiles.length} ` +
      `(${totals.added} links tagged, ${totals.refreshed} refreshed).`
  )
  if (options.check && changedFiles.length > 0) {
    console.error(`\nRun \`pnpm utm:readme-links\` to update:\n  ${changedFiles.join('\n  ')}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
