// Regenerates data/sql/error-links.postgres.json from the published /kb error links.
// Usage: node scripts/update-sql-error-links.mjs [path-or-url]
import { readFileSync, writeFileSync } from 'node:fs'

const source = process.argv[2] ?? 'https://supabase.com/kb/error-links.json'
const target = new URL('../data/sql/error-links.postgres.json', import.meta.url)

let links
if (/^https?:\/\//.test(source)) {
  const res = await fetch(source)
  if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`)
  links = await res.json()
} else {
  links = JSON.parse(readFileSync(source, 'utf8'))
}

const slice = Object.fromEntries(
  Object.entries(links.postgres ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
)
writeFileSync(target, `${JSON.stringify(slice, null, 2)}\n`)
